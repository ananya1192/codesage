import { Octokit } from "octokit";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { headers } from "next/headers";


export const getGithubToken = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const account = await prisma.account.findFirst({
    where: {
      userId: session.user.id,
      providerId: "github",
    },
  });

  if (!account?.accessToken) {
    throw new Error("No github access token found");
  }

  return account.accessToken;
};

export async function fetchUserContribution(
  token: string,
  username: string
) {
  const octokit = new Octokit({
    auth: token,
  });

  const query = `
    query ($username: String!) {
      user(login: $username) {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                contributionCount
                date
                color
              }
            }
          }
        }
      }
    }
  `;

  interface ContributionData {
    user: {
      contributionsCollection: {
        contributionCalendar: {
          totalContributions: number;
          weeks: {
            contributionDays: {
              contributionCount: number;
              date: string;
              color: string;
            }[];
          }[];
        };
      };
    };
  }

  try {
    const response: ContributionData = await octokit.graphql(query, {
      username,
    });

    const calendar =
      response.user.contributionsCollection.contributionCalendar;

    const yearTotals: Record<string, number> = {};

    calendar.weeks.forEach((week) => {
      week.contributionDays.forEach((day) => {
        const year = day.date.slice(0, 4);
        yearTotals[year] = (yearTotals[year] || 0) + day.contributionCount;
      });
    });

    console.log("Total Contributions:", calendar.totalContributions);
    console.log("Year Totals:", yearTotals);

    return calendar;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export const getRepositories = async ( page:number = 1 , perPage:number=10)=>{
const token = await getGithubToken();
const octokit = new Octokit({auth:token});

const {data} = await octokit.rest.repos.listForAuthenticatedUser({
sort: "updated",
direction: "desc",
visibility:"all",
per_page : perPage,
page : page

})
return data;
}

export const createWebhook = async (owner: string, repo: string) => {
  const token = await getGithubToken();
  const octokit = new Octokit({ auth: token });

  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_BASE_URL}/api/webhooks/github`;

  const { data: hooks } = await octokit.rest.repos.listWebhooks({
  owner,
  repo,
});

const existingHook = hooks.find(
  (hook) => hook.config?.url === webhookUrl
);

if (existingHook) {
  return existingHook;
}

const { data } = await octokit.rest.repos.createWebhook({
  owner,
  repo,
  config: {
    url: webhookUrl,
    content_type: "json",
    secret: process.env.GITHUB_WEBHOOK_SECRET!,
  },
  events: ["pull_request"],
});

return data;
};


export const deleteWebhook = async (owner: string, repo: string) => {
  const token = await getGithubToken();
  const octokit = new Octokit({ auth: token });

  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_BASE_URL}/api/webhooks/github`;

  try {
    const { data: hooks } = await octokit.rest.repos.listWebhooks({
      owner,
      repo,
    });

    const hookToDelete = hooks.find(
      (hook) => hook.config.url === webhookUrl
    );

    if (hookToDelete) {
      await octokit.rest.repos.deleteWebhook({
        owner,
        repo,
        hook_id: hookToDelete.id,
      });

      return true;
    }

    return false;
  } catch (error) {
    console.error("Error deleting webhook:", error);
    return false;
  }
};


export async function getRepoFileContents(
  token: string,
  owner: string,
  repo: string,
  path: string = ""
): Promise<{ path: string; content: string }[]> {
  const octokit = new Octokit({ auth: token });

  const { data } = await octokit.rest.repos.getContent({
    owner,
    repo,
    path,
  });

  if (!Array.isArray(data)) {
    // It's a file
    if (data.type === "file" && data.content) {
      return [
        {
          path: data.path,
          content: Buffer.from(data.content, "base64").toString("utf-8"),
        },
      ];
    }

    return [];
  }

  let files: { path: string; content: string }[] = [];

  for (const item of data) {
    console.log(item.type, item.path);
    if (item.type === "file") {
      const { data: fileData } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: item.path,
      });

      if (
        !Array.isArray(fileData) &&
        fileData.type === "file" &&
        fileData.content
      ) {
        // Filter out non-code files if needed
        if (
          !item.path.match(
            /\.(png|jpg|jpeg|gif|svg|ico|pdf|zip|tar|gz)$/i
          )
        ) {
          files.push({
            path: item.path,
            content: Buffer.from(
              fileData.content,
              "base64"
            ).toString("utf-8"),
          });
        }
      }
    } 
    
    else if (item.type === "dir") {
      const subFiles = await getRepoFileContents(
        token,
        owner,
        repo,
        item.path
      );

      files = files.concat(subFiles);
    }
  }
  console.log("Total files fetched:", files.length);
  return files;
}

export async function getPullRequestDetails(
  token: string,
  owner: string,
  repo: string,
  prNumber: number
) {
  const octokit = new Octokit({ auth: token });

  const { data: pr } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
  });

  return {
    title: pr.title,
    description: pr.body || "",
  };
}

export async function getPullRequestDiff(
  token: string,
  owner: string,
  repo: string,
  prNumber: number
) {
  const octokit = new Octokit({ auth: token });

  const { data: pr } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
  });


  const { data: diff } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
    mediaType: {
      format: "diff",
    },
  });


  return {
    diff: diff as unknown as string,
    title: pr.title,
    description: pr.body || "",
  };
}

export async function getCompareDiff(
  token: string,
  owner: string,
  repo: string,
  base: string,
  head: string
) {
  const octokit = new Octokit({ auth: token });

  const { data } = await octokit.rest.repos.compareCommits({
    owner,
    repo,
    base,
    head,
  });

  return {
    files: data.files ?? [],
  };
}

export async function postReviewComment(
  token: string,
  owner: string,
  repo: string,
  prNumber: number,
  review: string
) {
  const octokit = new Octokit({ auth: token });

  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body: `## 🚀 CodeSage AI Code Review

${review}

---

*Powered by **CodeSage***
`,
  });
}
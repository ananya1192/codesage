import { inngest } from "../client";
import { retrieveContext } from "@/module/ai/lib/rag";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import prisma from "@/lib/db";
import {
  checkAIRateLimit,
  incrementAIRateLimit,
} from "@/module/payment/lib/subscription";
import {
  getPullRequestDiff,
  getPullRequestDetails,
  getCompareDiff,
  postReviewComment,
} from "@/module/github/lib/github";

export const generateReview = inngest.createFunction(
  {
    id: "generate-review",
    concurrency: 5,
    triggers: {
      event: "pr.review.requested",
    },
  },

  async ({ event, step }) => {
    const {
    owner,
    repo,
   prNumber,
   userId,
   action,
   before,
   after,
} = event.data;
    //const { owner, repo, prNumber, userId } = event.data;
    const { diff, title, description, token } = await step.run("fetch-pr-data", async () => {

      const account = await prisma.account.findFirst({
        where: {
          userId: userId,
          providerId: "github"
        }
      })

      if (!account?.accessToken) {
        throw new Error("No GitHub access token found");
      }

      let diff = "";
let title = "";
let description = "";

if (action === "opened") {
  const data = await getPullRequestDiff(
    account.accessToken,
    owner,
    repo,
    prNumber
  );

  diff = data.diff;
  title = data.title;
  description = data.description;
}

else if (
  action === "synchronize" &&
  before &&
  after
) 
{
  const compare = await getCompareDiff(
    account.accessToken,
    owner,
    repo,
    before,
    after
  );

  diff = compare.files
    .map(
      (file: any) =>
        `File: ${file.filename}\n${file.patch ?? ""}`
    )
    .join("\n\n");

  const pr = await getPullRequestDetails(
  account.accessToken,
  owner,
  repo,
  prNumber
);

title = pr.title;
description = pr.description;

  
}


 else {
  throw new Error(`Unsupported PR action: ${action}`);
}


return {
  diff,
  title,
  description,
  token: account.accessToken,
};
    });
 console.log("Action:", action);
console.log("Diff length:", diff.length);
console.log(diff);

    const context = await step.run("retrieve-context", async () => {
      const query = `${title}\n${description}`;

      return await retrieveContext(query, `${owner}/${repo}`)
    });
    

    await step.run("check-rate-limit", async () => {
    await checkAIRateLimit(userId);
    });

    const review = await step.run("generate-ai-review", async () => {
      const prompt = `You are an expert code reviewer. Analyze the following pull request and provide a detailed, constructive code review.

PR Title: ${title}
PR Description: ${description || "No description provided"}

Context from Codebase:
${context.join("\n\n")}

Code Changes:
\`\`\`diff
${diff}
\`\`\`

Please provide:
1. **Walkthrough**: A file-by-file explanation of the changes.
2. **Sequence Diagram**: A Mermaid JS sequence diagram visualizing the flow of the changes (if applicable). Use \`\`\`mermaid ... \`\`\` block. **IMPORTANT**: Ensure the Mermaid syntax is valid. Do not use special characters (like quotes, braces, parentheses) inside Note text or labels as it breaks rendering. Keep the diagram simple.
3. **Summary**: Brief overview.
4. **Strengths**: What's done well.
5. **Issues**: Bugs, security concerns, code smells.
6. **Suggestions**: Specific code improvements.
7. **Poem**: A short, creative poem summarizing the changes at the very end.

Format your response in markdown.`;

console.log("Prompt characters:", prompt.length);
console.log(
  "Estimated tokens:",
  Math.ceil(prompt.length / 4)
);

const start = Date.now();

      const { text } = await generateText({
  model: google("gemini-3.6-flash"),
  prompt,
});

console.log(
  "AI generation time:",
  Date.now() - start,
  "ms"
);

      return text
    });

  

    await step.run("save-review" , async()=>{
      const repository = await prisma.repository.findFirst({
        where:{
          owner,
          name:repo
        }
      });

      if(repository){
                await prisma.review.create({
          data: {
            repositoryId: repository.id,
            prNumber,
            prTitle: title,
            prUrl: `https://github.com/${owner}/${repo}/pull/${prNumber}`,
            review,
            status: "completed",
          },
        });
      }
    })

    await step.run("increment-rate-limit", async () => {
  await incrementAIRateLimit(userId);
});

  await step.run("post-comment", async () => {
  try {
    await postReviewComment(token, owner, repo, prNumber, review);
  } catch (error) {
    console.error("Failed to post GitHub comment:", error);
  }
});

return {success:true}
  }
)
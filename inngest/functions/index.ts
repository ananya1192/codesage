import prisma from "@/lib/db";
import { inngest } from "../client";
import { getRepoFileContents } from "@/module/github/lib/github";
import { indexCodebase } from "@/module/ai/lib/rag";
import { file } from "better-auth";

type RepositoryConnectedEvent = {
  owner: string;
  repo: string;
  userId: string;
};

export const indexRepo = inngest.createFunction(
  {
    id: "index-repo",
    triggers: {
      event: "repository.connected",
    },
  },
  async ({ event, step }) => {
    const { owner, repo, userId } =
      event.data as RepositoryConnectedEvent;


    const files = await step.run(
      "fetch-files",
      async () => {

        const account = await prisma.account.findFirst({
          where: {
            userId,
            providerId: "github",
          },
        });


        if (!account?.accessToken) {
          throw new Error(
            "No GitHub access token found"
          );
        }


        return await getRepoFileContents(
          account.accessToken,
          owner,
          repo
        );
      }
    );


    await step.run(
      "index-codebase",
      async () => {

        await indexCodebase(
          `${owner}/${repo}`,
          files
        );


      
      }
    );


    return {
      success: true,
      indexedFiles : files.length,
      repository: `${owner}/${repo}`,
    };
  }
);
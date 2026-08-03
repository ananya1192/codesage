import { NextRequest, NextResponse } from "next/server";
import { reviewPullRequest } from "@/module/ai/actions"; // adjust path
import prisma from "@/lib/db";
import { verifyGitHubSignature } 
from "@/lib/github/verifySignature";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

const signature = req.headers.get("x-hub-signature-256");

if (!signature) {
  return NextResponse.json(
    { error: "Missing signature" },
    { status: 401 }
  );
}


const isValid = verifyGitHubSignature(
  rawBody,
  signature
);

console.log(
  "Webhook signature valid:",
  isValid
);


if (!isValid) {
  return NextResponse.json(
    { error: "Invalid signature" },
    { status: 401 }
  );
}


const deliveryId = req.headers.get(
  "x-github-delivery"
);

if (!deliveryId) {
  return NextResponse.json(
    { error: "Missing delivery id" },
    { status: 400 }
  );
}


const body = JSON.parse(rawBody);

const event = req.headers.get(
  "x-github-event"
);


if (event === "ping") {
  return NextResponse.json(
    { message: "Pong" },
    { status: 200 }
  );
}

if (event !== "pull_request") {
  return NextResponse.json(
    { message: "Event ignored" },
    { status: 200 }
  );
}


const existingEvent =
  await prisma.webhookEvent.findUnique({
    where: {
      id: deliveryId,
    },
  });


if (existingEvent) {
  console.log(
    "Duplicate webhook ignored:",
    deliveryId
  );

  return NextResponse.json({
    message: "Duplicate event ignored",
  });
}



await prisma.webhookEvent.create({
  data: {
    id: deliveryId,
    event: event || "unknown",
    repository: body.repository?.full_name || "unknown",
  },
});


if (event === "pull_request") {
  const action = body.action;

  const repo = body.repository.full_name;

  const prNumber = body.number;

  const [owner, repoName] =
    repo.split("/");


  if (
    action === "opened" ||
    action === "synchronize"
  ) {
    reviewPullRequest(
      owner,
      repoName,
      prNumber,
      action,
      body.before,
      body.after
    )
    .then(() =>
      console.log(
        `Review completed for ${repo} #${prNumber}`
      )
    )
    .catch((error) =>
      console.error(
        `Review failed for ${repo} #${prNumber}`,
        error
      )
    );
  }
}


return NextResponse.json(
  { message: "Event Processed" },
  { status: 200 }
);

  } catch (error) {
    console.error(
      "Error processing webhook:",
      error
    );

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
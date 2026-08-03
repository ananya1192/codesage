"use client";

import React from "react";
import ContributionGraph from "@/module/dashboard/components/contribution-graph";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  GitCommit,
  GitPullRequest,
  MessageSquare,
  GitBranch,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  getDashboardStats,
  getMonthlyActivity,
} from "@/module/dashboard/actions";

import { Spinner } from "@/components/ui/spinner";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const MainPage = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => await getDashboardStats(),
    refetchOnWindowFocus: false,
  });

  const {
    data: monthlyActivity,
    isLoading: isLoadingActivity,
  } = useQuery({
    queryKey: ["monthly-activity"],
    queryFn: async () => await getMonthlyActivity(),
    refetchOnWindowFocus: false,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your coding activity and AI reviews
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
     
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Repositories
            </CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : stats?.totalRepos || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Connected repositories
            </p>
          </CardContent>
        </Card>

      
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Commits
            </CardTitle>
            <GitCommit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : stats?.totalCommits || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              GitHub contributions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pull Requests
            </CardTitle>
            <GitPullRequest className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : stats?.totalPRs || 0}
            </div>
            <p className="text-xs text-muted-foreground">
               Pull Requests Reviewed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              AI Reviews
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : stats?.totalReviews || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Code reviews completed
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
  <CardHeader>
    <CardTitle>Contribution Activity</CardTitle>
  </CardHeader>

  <CardContent>
    <ContributionGraph />
  </CardContent>
</Card>

<div className="grid gap-4 md:grid-cols-2">
  <Card className="col-span-2">
    <CardHeader>
      <CardTitle>Activity Overview</CardTitle>
      <CardDescription>
        Monthly breakdown of commits, PRs, and reviews (last 6 months)
      </CardDescription>
    </CardHeader>

    <CardContent>
      <CardContent>
  {isLoadingActivity ? (
    <div className="h-80 w-full flex items-center justify-center">
      <Spinner />
    </div>
  ) : (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={monthlyActivity || []}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--background)",
              borderColor: "var(--border)",
            }}
            itemStyle={{
              color: "var(--foreground)",
            }}
          />
          <Legend />
          <Bar dataKey="commits" fill="#22c55e" name="Commits" />
          <Bar dataKey="prs" fill="#3b82f6" name="PRs" />
          <Bar dataKey="reviews" fill="#f59e0b" name="Reviews" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )}
</CardContent>
    </CardContent>
  </Card>
</div>
    </div>
  );
};

export default MainPage;

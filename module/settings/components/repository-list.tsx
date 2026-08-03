"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ExternalLink,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import {
  getConnectedRepositories,
  disconnectRepository,
  disconnectAllRepository,
} from "@/module/settings/actions";

export function RepositoryList() {
  const queryClient = useQueryClient();

  const [disconnectAllOpen, setDisconnectAllOpen] = useState(false);

  const { data: repositories, isLoading } = useQuery({
    queryKey: ["connected-repositories"],
    queryFn: async () => await getConnectedRepositories(),
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });

  const disconnectMutation = useMutation({
    mutationFn: async (repositoryId: string) => {
      return await disconnectRepository(repositoryId);
    },

    onSuccess: (result) => {
      if (result?.success) {
        queryClient.invalidateQueries({
          queryKey: ["connected-repositories"],
        });

        queryClient.invalidateQueries({
          queryKey: ["dashboard-stats"],
        });

        toast.success("Repository disconnected successfully");
      } else {
        toast.error(
          result?.error || "Failed to disconnect repository"
        );
      }
    },

    onError: () => {
      toast.error("Failed to disconnect repository");
    },
  });

  const disconnectAllMutation = useMutation({
    mutationFn: async () => {
      return await disconnectAllRepository();
    },

    onSuccess: (result) => {
      if (result?.success) {
        queryClient.invalidateQueries({
          queryKey: ["connected-repositories"],
        });

        queryClient.invalidateQueries({
          queryKey: ["dashboard-stats"],
        });

        setDisconnectAllOpen(false);

        toast.success(
          `${result.count} repositories disconnected successfully`
        );
      } else {
        toast.error(
          result?.error || "Failed to disconnect repositories"
        );
      }
    },

    onError: () => {
      toast.error("Failed to disconnect repositories");
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connected Repositories</CardTitle>
          <CardDescription>
            Manage your connected GitHub repositories
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 rounded bg-muted"></div>
            <div className="h-20 rounded bg-muted"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Connected Repositories</CardTitle>
            <CardDescription>
              Manage your connected GitHub repositories
            </CardDescription>
          </div>

          {repositories && repositories.length > 0 && (
  <AlertDialog>
    <AlertDialogTrigger className="inline-flex items-center gap-2 rounded-md bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground">
  <Trash2 className="h-4 w-4" />
  Disconnect All
</AlertDialogTrigger>

    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          Disconnect All Repositories?
        </AlertDialogTitle>

        <AlertDialogDescription>
          This will disconnect all {repositories.length} repositories
          and delete all associated AI reviews.
          This action cannot be undone.
        </AlertDialogDescription>
      </AlertDialogHeader>

      <AlertDialogFooter>
        <AlertDialogCancel>
          Cancel
        </AlertDialogCancel>

        <AlertDialogAction
          onClick={() =>
            disconnectAllMutation.mutate()
          }
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          disabled={disconnectAllMutation.isPending}
        >
          {disconnectAllMutation.isPending
            ? "Disconnecting..."
            : "Disconnect All"}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
)}
        </div>
      </CardHeader>

      <CardContent>
        {!repositories || repositories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <AlertTriangle className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">
              No connected repositories found.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {repositories.map((repo) => (
              <div
                key={repo.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{repo.name}</h3>
                    <Badge variant="secondary">Connected</Badge>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {repo.fullName}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    Connected on{" "}
                    {new Date(repo.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      window.open(repo.url, "_blank", "noopener,noreferrer")
                    }
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>

                  <AlertDialog>
  <AlertDialogTrigger>
    <Button
      variant="destructive"
      size="icon"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Disconnect Repository?
                        </AlertDialogTitle>

                        <AlertDialogDescription>
                          This will disconnect <strong>{repo.name}</strong> and remove
                          all associated AI reviews.
                          <br />
                          <br />
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>

                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>

                        <AlertDialogAction
                          onClick={() => disconnectMutation.mutate(repo.id)}
                          disabled={disconnectMutation.isPending}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {disconnectMutation.isPending
                            ? "Disconnecting..."
                            : "Disconnect"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { Input } from "../../ui/input";
import { cn } from "@/lib/utils";
import { useGhToken } from "@/components/auth/use-gh-token";

interface Repo {
  id: number;
  name: string;
  html_url: string;
  description: string | null;
  private: boolean;
}

interface Props {
  selectedRepoId: number | null;
  onSelectRepo: (repoId: number) => void;
}

export default function GithubRepoSelecter({ selectedRepoId, onSelectRepo }: Props) {
  const { ghToken } = useGhToken();
  const [search, setSearch] = useState('');

  const { data: allRepos = [], isLoading } = useQuery({
    queryKey: ['github-repos', ghToken],
    queryFn: async (): Promise<Repo[]> => {
      const response = await fetch('https://api.github.com/user/repos?per_page=100', {
        headers: {
          Authorization: `token ${ghToken}`,
          Accept: 'application/vnd.github+json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch repositories');
      }

      return response.json();
    },
    enabled: !!ghToken,
  });

  const filteredRepos = useMemo(() => {
    if (!search.trim()) {
      return allRepos.slice(0, 5);
    }

    const searchLower = search.toLowerCase();
    return allRepos
      .filter(repo =>
        repo.name.toLowerCase().includes(searchLower) ||
        (repo.description && repo.description.toLowerCase().includes(searchLower)) ||
        repo.id === selectedRepoId
      )
      .sort((a, b) => {
        if (a.id === selectedRepoId) return -1;
        if (b.id === selectedRepoId) return 1;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 5);
  }, [search, allRepos, selectedRepoId]);

  return (
    <div className="space-y-4">
      <Input
        type="text"
        placeholder="Search your repositories..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full"
      />

      <div className="space-y-2">



        <div className="p-4 border border-gray-400 rounded-lg">
          {filteredRepos.map((repo: Repo) => (
            <div
              key={repo.id}
              className={cn(
                "border-gray-700 p-3 hover:bg-accent transition-colors flex items-center justify-between",
                repo.id === filteredRepos[filteredRepos.length - 1].id ? '' : 'border-b'
              )}
              onClick={() => onSelectRepo(repo.id)}
            >
              <div className="space-y-1">
                <h3 className="font-medium">
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {repo.name}
                  </a>
                </h3>
                <p className="text-xs text-muted-foreground">
                  {repo.private ? "Private" : "Public"}
                </p>
                {repo.description && (
                  <p className="text-sm text-muted-foreground">{repo.description}</p>
                )}
              </div>
              {selectedRepoId === repo.id && (
                <Check className="h-5 w-5 text-black bg-white rounded-full p-0.5" />
              )}
            </div>
          ))}
          {isLoading && Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="py-3">
              <div className="h-[45px] py-3 w-full animate-pulse bg-gray-800 rounded-lg" />
            </div>
          ))}
          {!isLoading && filteredRepos.length === 0 && search.trim() && (
            <p className="text-sm text-muted-foreground">No repositories found.</p>
          )}
          {!isLoading && filteredRepos.length === 0 && !search.trim() && allRepos.length === 0 && (
            <p className="text-sm text-muted-foreground">No repositories available.</p>
          )}
        </div>

      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { TopNav } from "@/components/TopNav";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Search, Calendar, Download, Copy, Check } from "lucide-react";
import { callEdgeFunction } from "@/lib/auth";
import { toast } from "sonner";
import { format } from "date-fns";

interface AuditLog {
  id: string;
  action: string;
  module: string;
  actor_email: string | null;
  actor_role: string | null;
  target_email: string | null;
  target_summary: string | null;
  details: any;
  metadata: any;
  success: boolean;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  LOGIN_SUCCESS: "bg-green-500/10 text-green-700 dark:text-green-400",
  LOGOUT: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  LOGIN_FAILED: "bg-red-500/10 text-red-700 dark:text-red-400",
  PASSWORD_CHANGED: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  EMAIL_CHANGED: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  PROFILE_UPDATED: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
  OTP_VERIFIED: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  OTP_FAILED: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
  ROLE_CHANGED: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
};

const ACTION_MESSAGES: Record<string, string> = {
  LOGIN_SUCCESS: "Successfully logged in",
  LOGOUT: "Logged out",
  LOGIN_FAILED: "Failed login attempt",
  PASSWORD_CHANGED: "Changed password",
  EMAIL_CHANGED: "Changed email address",
  PROFILE_UPDATED: "Updated profile information",
  OTP_VERIFIED: "Verified OTP successfully",
  OTP_FAILED: "Failed OTP verification",
  ROLE_CHANGED: "Role was changed",
};

export default function MyActivity() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search) params.append("search", search);
      if (actionFilter) params.append("action", actionFilter);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await callEdgeFunction(`get-my-activity?${params.toString()}`);

      setLogs(response.logs || []);
      setTotal(response.total || 0);
      setTotalPages(response.totalPages || 0);
    } catch (error: any) {
      console.error("Error fetching activity logs:", error);
      toast.error(error.message || "Failed to load activity logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, limit, actionFilter, startDate, endDate]);

  const handleSearch = () => {
    setPage(1);
    fetchLogs();
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportToCSV = () => {
    const headers = ["Date", "Action", "Module", "Status", "IP Address"];
    const rows = logs.map((log) => [
      format(new Date(log.created_at), "PPpp"),
      ACTION_MESSAGES[log.action] || log.action,
      log.module,
      log.success ? "Success" : "Failed",
      log.ip_address || "N/A",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `my-activity-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported to CSV");
  };

  const getActionBadgeClass = (action: string) => {
    return ACTION_COLORS[action] || "bg-gray-500/10 text-gray-700 dark:text-gray-400";
  };

  const getActionMessage = (action: string) => {
    return ACTION_MESSAGES[action] || action.replace(/_/g, " ");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <TopNav />
          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">My Activity</h1>
                  <p className="text-muted-foreground mt-2">
                    View your personal activity logs and account history
                  </p>
                </div>
                <Button onClick={exportToCSV} variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Filters</CardTitle>
                  <CardDescription>Search and filter your activity logs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      />
                      <Button onClick={handleSearch} size="icon" variant="secondary">
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>

                    <Select value={actionFilter || "all"} onValueChange={(val) => setActionFilter(val === "all" ? "" : val)}>
                      <SelectTrigger>
                        <SelectValue placeholder="All actions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All actions</SelectItem>
                        <SelectItem value="LOGIN_SUCCESS">Login Success</SelectItem>
                        <SelectItem value="LOGOUT">Logout</SelectItem>
                        <SelectItem value="LOGIN_FAILED">Login Failed</SelectItem>
                        <SelectItem value="PASSWORD_CHANGED">Password Changed</SelectItem>
                        <SelectItem value="EMAIL_CHANGED">Email Changed</SelectItem>
                        <SelectItem value="PROFILE_UPDATED">Profile Updated</SelectItem>
                        <SelectItem value="OTP_VERIFIED">OTP Verified</SelectItem>
                        <SelectItem value="OTP_FAILED">OTP Failed</SelectItem>
                        <SelectItem value="ROLE_CHANGED">Role Changed</SelectItem>
                      </SelectContent>
                    </Select>

                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      placeholder="Start date"
                    />

                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      placeholder="End date"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Activity History</CardTitle>
                      <CardDescription>{total} total activities</CardDescription>
                    </div>
                    <Select
                      value={limit.toString()}
                      onValueChange={(value) => {
                        setLimit(parseInt(value));
                        setPage(1);
                      }}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 per page</SelectItem>
                        <SelectItem value="25">25 per page</SelectItem>
                        <SelectItem value="50">50 per page</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-12 text-muted-foreground">Loading...</div>
                  ) : logs.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      No activity logs found
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-md border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date & Time</TableHead>
                              <TableHead>Action</TableHead>
                              <TableHead>Module</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>IP Address</TableHead>
                              <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {logs.map((log) => (
                              <TableRow key={log.id}>
                                <TableCell className="font-medium">
                                  {format(new Date(log.created_at), "PPp")}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="secondary"
                                    className={getActionBadgeClass(log.action)}
                                  >
                                    {getActionMessage(log.action)}
                                  </Badge>
                                </TableCell>
                                <TableCell>{log.module}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant={log.success ? "default" : "destructive"}
                                  >
                                    {log.success ? "Success" : "Failed"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-muted-foreground">
                                    {log.ip_address || "N/A"}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() =>
                                      handleCopy(
                                        `${format(new Date(log.created_at), "PPpp")} - ${getActionMessage(log.action)}`,
                                        log.id
                                      )
                                    }
                                  >
                                    {copiedId === log.id ? (
                                      <Check className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {totalPages > 1 && (
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                              />
                            </PaginationItem>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              const pageNum = i + 1;
                              return (
                                <PaginationItem key={pageNum}>
                                  <PaginationLink
                                    onClick={() => setPage(pageNum)}
                                    isActive={page === pageNum}
                                    className="cursor-pointer"
                                  >
                                    {pageNum}
                                  </PaginationLink>
                                </PaginationItem>
                              );
                            })}
                            <PaginationItem>
                              <PaginationNext
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                className={
                                  page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"
                                }
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

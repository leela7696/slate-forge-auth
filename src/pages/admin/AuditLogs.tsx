import { useState, useEffect } from "react";
import { TopNav } from "@/components/TopNav";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { callEdgeFunction } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Search, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface AuditLog {
  id: string;
  action: string;
  module: string;
  actor_id: string | null;
  actor_email: string | null;
  actor_role: string | null;
  target_id: string | null;
  target_email: string | null;
  target_summary: string | null;
  target_type: string | null;
  details: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  } | null;
  metadata: any;
  success: boolean;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [successFilter, setSuccessFilter] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const { toast } = useToast();

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (search) params.append('search', search);
      if (actionFilter) params.append('action', actionFilter);
      if (moduleFilter) params.append('module', moduleFilter);
      if (successFilter) params.append('success', successFilter);
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());

      const data = await callEdgeFunction('get-audit-logs', params);
      setLogs(data.logs);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch audit logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, pageSize, search, actionFilter, moduleFilter, successFilter, startDate, endDate]);

  const getActionBadgeColor = (action: string) => {
    if (action.includes('CREATE')) return 'bg-green-500/10 text-green-500 border-green-500/20';
    if (action.includes('UPDATE') || action.includes('CHANGE')) return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    if (action.includes('DELETE')) return 'bg-red-500/10 text-red-500 border-red-500/20';
    if (action.includes('LOGIN')) return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
    if (action.includes('OTP')) return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
    return 'bg-muted text-muted-foreground';
  };

  const getInitials = (email: string | null) => {
    if (!email) return '?';
    return email.charAt(0).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm:ss');
  };

  const renderDiffField = (label: string, before: any, after: any) => {
    if (before === after) return null;
    
    return (
      <div className="space-y-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="text-xs text-muted-foreground mb-1">Before</div>
            <code className="text-sm bg-red-500/10 text-red-500 px-2 py-1 rounded block">
              {JSON.stringify(before)}
            </code>
          </div>
          <div className="flex-1">
            <div className="text-xs text-muted-foreground mb-1">After</div>
            <code className="text-sm bg-green-500/10 text-green-500 px-2 py-1 rounded block">
              {JSON.stringify(after)}
            </code>
          </div>
        </div>
      </div>
    );
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <TopNav />
          <main className="flex-1 p-6">
            <div className="max-w-[1400px] mx-auto space-y-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
                <p className="text-muted-foreground mt-2">
                  View system activity and security events
                </p>
              </div>

              <Card className="p-6">
                <div className="space-y-4">
                  {/* Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>

                    <Select value={actionFilter} onValueChange={setActionFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All actions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All actions</SelectItem>
                        <SelectItem value="USER_LOGIN">Login</SelectItem>
                        <SelectItem value="USER_CREATED">User Created</SelectItem>
                        <SelectItem value="USER_UPDATED">User Updated</SelectItem>
                        <SelectItem value="USER_DELETED">User Deleted</SelectItem>
                        <SelectItem value="STATUS_CHANGED">Status Changed</SelectItem>
                        <SelectItem value="ROLE_CHANGED">Role Changed</SelectItem>
                        <SelectItem value="PERMISSION_UPDATED">Permission Updated</SelectItem>
                        <SelectItem value="OTP_SENT">OTP Sent</SelectItem>
                        <SelectItem value="OTP_VERIFIED">OTP Verified</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={moduleFilter} onValueChange={setModuleFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All modules" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All modules</SelectItem>
                        <SelectItem value="auth">Authentication</SelectItem>
                        <SelectItem value="users">User Management</SelectItem>
                        <SelectItem value="Profile">Profile</SelectItem>
                        <SelectItem value="RBAC">RBAC</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={successFilter} onValueChange={setSuccessFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All status</SelectItem>
                        <SelectItem value="true">Success</SelectItem>
                        <SelectItem value="false">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Range */}
                  <div className="flex items-center gap-4">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : "Start date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus className="pointer-events-auto" />
                      </PopoverContent>
                    </Popover>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP") : "End date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus className="pointer-events-auto" />
                      </PopoverContent>
                    </Popover>

                    {(startDate || endDate) && (
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setStartDate(undefined);
                          setEndDate(undefined);
                        }}
                      >
                        Clear dates
                      </Button>
                    )}
                  </div>
                </div>
              </Card>

              <Card>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Action</TableHead>
                        <TableHead>Performed By</TableHead>
                        <TableHead>Module</TableHead>
                        <TableHead>Target</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Timestamp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            Loading...
                          </TableCell>
                        </TableRow>
                      ) : logs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No audit logs found
                          </TableCell>
                        </TableRow>
                      ) : (
                        logs.map((log) => (
                          <TableRow
                            key={log.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => setSelectedLog(log)}
                          >
                            <TableCell>
                              <Badge variant="outline" className={getActionBadgeColor(log.action)}>
                                {log.action}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>{getInitials(log.actor_email)}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium">{log.actor_email || 'System'}</span>
                                  {log.actor_role && (
                                    <span className="text-xs text-muted-foreground">{log.actor_role}</span>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{log.module}</Badge>
                            </TableCell>
                            <TableCell>
                              {log.target_email ? (
                                <div className="flex flex-col">
                                  <span className="text-sm">{log.target_email}</span>
                                  {log.target_summary && (
                                    <span className="text-xs text-muted-foreground">{log.target_summary}</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={log.success ? "default" : "destructive"}>
                                {log.success ? 'Success' : 'Failed'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(log.created_at)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      Showing {logs.length > 0 ? (page - 1) * pageSize + 1 : 0} to{' '}
                      {Math.min(page * pageSize, total)} of {total} entries
                    </span>
                    <Select value={pageSize.toString()} onValueChange={(val) => setPageSize(Number(val))}>
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </main>
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Action</div>
                  <Badge variant="outline" className={getActionBadgeColor(selectedLog.action)}>
                    {selectedLog.action}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Module</div>
                  <Badge variant="secondary">{selectedLog.module}</Badge>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Status</div>
                  <Badge variant={selectedLog.success ? "default" : "destructive"}>
                    {selectedLog.success ? 'Success' : 'Failed'}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Timestamp</div>
                  <div className="text-sm">{formatDate(selectedLog.created_at)}</div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Performed By</div>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{getInitials(selectedLog.actor_email)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{selectedLog.actor_email || 'System'}</span>
                      {selectedLog.actor_role && (
                        <span className="text-xs text-muted-foreground">{selectedLog.actor_role}</span>
                      )}
                    </div>
                  </div>
                </div>

                {selectedLog.target_email && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">Target</div>
                    <div className="text-sm">{selectedLog.target_email}</div>
                    {selectedLog.target_summary && (
                      <div className="text-xs text-muted-foreground">{selectedLog.target_summary}</div>
                    )}
                  </div>
                )}

                {selectedLog.details?.before || selectedLog.details?.after ? (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-3">Changes</div>
                    <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                      {selectedLog.details.before && selectedLog.details.after && (
                        Object.keys({ ...selectedLog.details.before, ...selectedLog.details.after }).map((key) => 
                          renderDiffField(
                            key,
                            selectedLog.details?.before?.[key],
                            selectedLog.details?.after?.[key]
                          )
                        )
                      )}
                    </div>
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                  <div>
                    <span className="font-medium">IP Address:</span> {selectedLog.ip_address || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">User Agent:</span> {selectedLog.user_agent || 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}

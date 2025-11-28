import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Calendar, Phone, Briefcase } from "lucide-react";
import { format } from "date-fns";

interface ProfileCardProps {
  user: {
    name: string;
    email: string;
    role: string;
    phone?: string;
    department?: string;
    created_at?: string;
    profile_picture_url?: string;
  };
}

export function ProfileCard({ user }: ProfileCardProps) {
  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <Card className="bg-[#04160e]/70 backdrop-blur-xl border border-green-500/20 shadow-green-500/10 shadow-xl rounded-2xl">
      <CardContent className="p-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar */}
          <Avatar className="h-24 w-24 border-4 border-green-500/40 shadow-green-500/30 shadow-lg">
            {user.profile_picture_url ? (
              <AvatarImage src={user.profile_picture_url} alt={user.name} />
            ) : (
              <AvatarFallback className="text-2xl font-bold bg-green-600/30 text-green-300 backdrop-blur-md">
                {getInitials(user.name)}
              </AvatarFallback>
            )}
          </Avatar>

          {/* User Info */}
          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <h2 className="text-3xl font-bold text-white">{user.name}</h2>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-3">
                <Badge
                  className="text-sm bg-green-600/25 text-green-300 border border-green-500/40 px-3 py-1 rounded-full shadow-sm"
                >
                  {user.role}
                </Badge>
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-white/70">
                <Mail className="h-4 w-4 text-green-400" />
                <span>{user.email}</span>
              </div>

              {user.phone && (
                <div className="flex items-center gap-2 text-white/70">
                  <Phone className="h-4 w-4 text-green-400" />
                  <span>{user.phone}</span>
                </div>
              )}

              {user.department && (
                <div className="flex items-center gap-2 text-white/70">
                  <Briefcase className="h-4 w-4 text-green-400" />
                  <span>{user.department}</span>
                </div>
              )}

              {user.created_at && (
                <div className="flex items-center gap-2 text-white/70">
                  <Calendar className="h-4 w-4 text-green-400" />
                  <span>
                    Joined {format(new Date(user.created_at), "MMM yyyy")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

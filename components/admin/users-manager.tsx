"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2, UserMinus, UserPlus } from "lucide-react"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { UserAvatar } from "@/components/admin/user-avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { changeUserRole, inviteUser, removeUser } from "@/lib/actions/admin"
import { timeAgo } from "@/lib/utils"
import { inviteSchema, type InviteInput } from "@/lib/validations/cms"

export type TeamMember = {
  id: string
  name: string
  username: string | null
  email: string
  avatarUrl: string | null
  role: "admin" | "author"
  postCount: number
  lastSignIn: string | null
  invited: boolean
}

export function UsersManager({ users, currentUserId }: { users: TeamMember[]; currentUserId: string }) {
  const router = useRouter()

  async function setRole(user: TeamMember, role: "admin" | "author") {
    const result = await changeUserRole(user.id, role)
    if (!result.success) return toast.error(result.error)
    toast.success(`${user.name} is now ${role === "admin" ? "an admin" : "an author"}`)
    router.refresh()
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-background">
      <div className="flex items-center justify-between gap-3 border-b p-4">
        <p className="text-sm text-muted-foreground">
          {users.length} team {users.length === 1 ? "member" : "members"}
        </p>
        <InviteDialog onInvited={() => router.refresh()} />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-5">Member</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="hidden text-right md:table-cell">Posts</TableHead>
            <TableHead className="hidden lg:table-cell">Last sign-in</TableHead>
            <TableHead className="w-12 pr-5">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => {
            const isSelf = u.id === currentUserId
            return (
              <TableRow key={u.id}>
                <TableCell className="pl-5">
                  <div className="flex items-center gap-3">
                    <UserAvatar name={u.name} src={u.avatarUrl} size={36} />
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {u.name} {isSelf && <span className="text-xs font-normal text-muted-foreground">(you)</span>}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Select value={u.role} onValueChange={(v) => setRole(u, v as "admin" | "author")} disabled={isSelf}>
                    <SelectTrigger className="h-8 w-28" aria-label={`Role for ${u.name}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="author">Author</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="hidden text-right tabular-nums md:table-cell">{u.postCount}</TableCell>
                <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                  {u.invited ? <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">Invite pending</span> : u.lastSignIn ? timeAgo(u.lastSignIn) : "Never"}
                </TableCell>
                <TableCell className="pr-5">
                  {!isSelf && (
                    <ConfirmDialog
                      trigger={
                        <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive" aria-label={`Remove ${u.name}`}>
                          <UserMinus />
                        </Button>
                      }
                      title={`Remove ${u.name}?`}
                      description={`They'll lose access immediately. Their ${u.postCount} ${u.postCount === 1 ? "post stays" : "posts stay"} published under the site byline.`}
                      confirmLabel="Remove"
                      onConfirm={async () => {
                        const result = await removeUser(u.id)
                        if (!result.success) {
                          toast.error(result.error)
                          return false
                        }
                        toast.success(`${u.name} removed`)
                        router.refresh()
                      }}
                    />
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

function InviteDialog({ onInvited }: { onInvited: () => void }) {
  const [open, setOpen] = useState(false)
  const form = useForm<InviteInput>({ resolver: zodResolver(inviteSchema), defaultValues: { email: "", full_name: "", role: "author" } })
  const { errors, isSubmitting } = form.formState

  async function onSubmit(values: InviteInput) {
    const result = await inviteUser(values)
    if (!result.success) return toast.error(result.error)
    toast.success(`Invitation sent to ${values.email}`)
    form.reset()
    setOpen(false)
    onInvited()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-9">
          <UserPlus /> Invite member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle className="font-sans">Invite a team member</DialogTitle>
            <DialogDescription>They&apos;ll get an email with a link to set their password.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="invite-name">Full name</Label>
            <Input id="invite-name" autoFocus aria-invalid={Boolean(errors.full_name)} {...form.register("full_name")} />
            {errors.full_name && <p className="text-sm text-destructive">{errors.full_name.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="invite-email">Email</Label>
            <Input id="invite-email" type="email" aria-invalid={Boolean(errors.email)} {...form.register("email")} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="invite-role">Role</Label>
            <Controller
              control={form.control}
              name="role"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="invite-role" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="author">Author: writes and manages their own posts</SelectItem>
                    <SelectItem value="admin">Admin: full access to everything</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Send invite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

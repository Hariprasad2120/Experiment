import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn } from "@/components/motion-div";
import { toTitleCase } from "@/lib/utils";
import { ExtensionActions } from "./extension-actions";

export default async function ExtensionsPage() {
  const extensions = await prisma.extensionRequest.findMany({
    include: {
      cycle: { include: { user: true } },
      requester: { select: { name: true, role: true } },
      decidedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const pending = extensions.filter((e) => e.status === "PENDING");
  const decided = extensions.filter((e) => e.status !== "PENDING");

  return (
    <div className="space-y-6">
      <FadeIn>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Extension Requests</h1>
        <p className="text-slate-500 text-sm mt-1">
          {pending.length} pending approval
        </p>
      </FadeIn>

      {pending.length > 0 && (
        <FadeIn delay={0.1}>
          <Card className="border-0 shadow-sm border-l-4 border-l-orange-400">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-orange-600">Pending Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pending.map((e) => (
                <div key={e.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        {toTitleCase(e.cycle.user.name)} — {e.requester.role}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Requested by {toTitleCase(e.requester.name)} on {e.createdAt.toLocaleDateString()}
                      </div>
                    </div>
                    <ExtensionActions extensionId={e.id} />
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded p-2">
                    {e.reason}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {decided.length > 0 && (
        <FadeIn delay={0.2}>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Decided</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b bg-slate-50 dark:bg-slate-800/50">
                    <th className="py-3 px-4 font-medium">Employee</th>
                    <th className="px-4 font-medium">Requester</th>
                    <th className="px-4 font-medium">Status</th>
                    <th className="px-4 font-medium">Extended Until</th>
                    <th className="px-4 font-medium">Decided By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {decided.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-4 font-medium">{toTitleCase(e.cycle.user.name)}</td>
                      <td className="px-4 text-slate-500">{toTitleCase(e.requester.name)}</td>
                      <td className="px-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          e.status === "APPROVED"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}>
                          {e.status}
                        </span>
                      </td>
                      <td className="px-4 text-slate-500">{e.extendedUntil?.toLocaleDateString() ?? "—"}</td>
                      <td className="px-4 text-slate-500">{e.decidedBy?.name ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {extensions.length === 0 && (
        <FadeIn delay={0.1}>
          <Card className="border-0 shadow-sm">
            <CardContent className="py-12 text-center text-slate-400">
              No extension requests yet.
            </CardContent>
          </Card>
        </FadeIn>
      )}
    </div>
  );
}

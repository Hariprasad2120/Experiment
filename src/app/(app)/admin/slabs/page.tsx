import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn, StaggerList, StaggerItem } from "@/components/motion-div";
import { SlabForm } from "./slab-form";
import { deleteSlabAction } from "./actions";

export default async function SlabsPage() {
  const slabs = await prisma.incrementSlab.findMany({ orderBy: { minRating: "desc" } });

  return (
    <div className="space-y-6">
      <FadeIn>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Increment Slabs</h1>
        <p className="text-slate-500 text-sm mt-1">Define salary hike % per rating band</p>
      </FadeIn>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <FadeIn delay={0.1}>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Current Slabs</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b bg-slate-50 dark:bg-slate-800/50">
                    <th className="py-3 px-4 font-medium">Label</th>
                    <th className="px-4 font-medium">Min Rating</th>
                    <th className="px-4 font-medium">Max Rating</th>
                    <th className="px-4 font-medium">Hike %</th>
                    <th className="px-4 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {slabs.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{s.label}</td>
                      <td className="px-4 text-slate-600 dark:text-slate-400">{s.minRating}</td>
                      <td className="px-4 text-slate-600 dark:text-slate-400">{s.maxRating}</td>
                      <td className="px-4">
                        <span className="text-green-600 dark:text-green-400 font-semibold">{s.hikePercent}%</span>
                      </td>
                      <td className="px-4">
                        <form action={deleteSlabAction}>
                          <input type="hidden" name="id" value={s.id} />
                          <button
                            type="submit"
                            className="text-xs text-red-600 hover:text-red-700 font-medium"
                          >
                            Delete
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                  {slabs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">No slabs configured</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.2}>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Add New Slab</CardTitle>
            </CardHeader>
            <CardContent>
              <SlabForm />
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}

import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { deleteEmployeeAction, deleteSalaryAction } from "../actions";
import { toTitleCase } from "@/lib/utils";

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: { salary: true, reportingManager: { select: { id: true, name: true, employeeNumber: true } } },
  });
  if (!user) notFound();

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {toTitleCase(user.name)}{" "}
            <span className="text-sm text-muted-foreground font-normal">
              #{user.employeeNumber ?? "-"} · {user.role}
            </span>
          </h1>
          <p className="text-sm text-muted-foreground">
            {user.designation ?? "-"} · {user.department ?? "-"} · {user.location ?? "-"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/employees" className="text-sm underline self-center">
            Back
          </Link>
          <Link href={`/admin/employees/${user.id}/edit`}>
            <Button variant="outline" size="sm">
              Edit
            </Button>
          </Link>
          <form action={deleteEmployeeAction}>
            <input type="hidden" name="id" value={user.id} />
            <Button type="submit" variant="destructive" size="sm">
              Delete
            </Button>
          </form>
        </div>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList>
          <TabsTrigger value="basic">Basic Details</TabsTrigger>
          <TabsTrigger value="salary">Salary Details</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-3 gap-x-6 gap-y-3 text-sm">
                <Row label="Employee #" value={user.employeeNumber ?? "-"} />
                <Row label="First Name" value={toTitleCase(user.firstName)} />
                <Row label="Last Name" value={toTitleCase(user.lastName)} />
                <Row label="Email (login)" value={user.email} />
                <Row label="Personal Email" value={user.personalEmail} />
                <Row label="Father Name" value={toTitleCase(user.fatherName)} />
                <Row label="DOB" value={user.dob?.toLocaleDateString()} />
                <Row label="Gender" value={user.gender} />
                <Row label="Marital Status" value={user.maritalStatus} />
                <Row label="App Role" value={user.role} />
                <Row label="Designation" value={user.designation} />
                <Row label="Department" value={user.department} />
                <Row label="Zoho Role" value={user.zohoRole} />
                <Row label="Employment Type" value={user.employmentType} />
                <Row label="Employee Status" value={user.employeeStatus} />
                <Row label="Source of Hire" value={user.sourceOfHire} />
                <Row label="Location" value={user.location} />
                <Row label="Joining Date" value={user.joiningDate.toLocaleDateString()} />
                <Row label="Active" value={user.active ? "Yes" : "No"} />
                <Row
                  label="Reporting Manager"
                  value={
                    user.reportingManager
                      ? `${toTitleCase(user.reportingManager.name)} (#${user.reportingManager.employeeNumber ?? "-"})`
                      : "-"
                  }
                />
                <Row label="Work Phone" value={user.workPhone} />
                <Row label="Personal Phone" value={user.personalPhone} />
                <Row label="Aadhaar" value={user.aadhaar} />
                <Row label="PAN" value={user.pan} />
                <Row label="UAN" value={user.uan} />
                <Row label="Bank" value={user.bankName} />
                <Row label="Account #" value={user.bankAccount} />
                <Row label="IFSC" value={user.ifsc} />
                <Row label="Account Type" value={user.accountType} />
                <Row label="State Code" value={user.stateCode} />
                <div className="col-span-3">
                  <dt className="text-xs text-muted-foreground">Present Address</dt>
                  <dd>{user.presentAddress ?? "-"}</dd>
                </div>
                <div className="col-span-3">
                  <dt className="text-xs text-muted-foreground">Permanent Address</dt>
                  <dd>{user.permanentAddress ?? "-"}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="salary" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Salary Details</span>
                <div className="flex gap-2">
                  <Link href={`/admin/employees/${user.id}/edit?tab=salary`}>
                    <Button variant="outline" size="sm">
                      {user.salary ? "Edit Salary" : "Add Salary"}
                    </Button>
                  </Link>
                  {user.salary && (
                    <form action={deleteSalaryAction}>
                      <input type="hidden" name="userId" value={user.id} />
                      <Button type="submit" variant="destructive" size="sm">
                        Clear
                      </Button>
                    </form>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user.salary ? (
                <dl className="grid grid-cols-3 gap-x-6 gap-y-3 text-sm">
                  <Row label="Gross (per annum)" value={money(user.salary.grossAnnum)} />
                  <Row label="CTC (per annum)" value={money(user.salary.ctcAnnum)} />
                  <Row label="Basic" value={money(user.salary.basic)} />
                  <Row label="HRA" value={money(user.salary.hra)} />
                  <Row label="Conveyance" value={money(user.salary.conveyance)} />
                  <Row label="Transport" value={money(user.salary.transport)} />
                  <Row label="Travelling" value={money(user.salary.travelling)} />
                  <Row label="Fixed Allowance" value={money(user.salary.fixedAllowance)} />
                  <Row label="Stipend" value={money(user.salary.stipend)} />
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">No salary record.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd>{value ?? "-"}</dd>
    </div>
  );
}

function money(v: unknown): string {
  return Number(v ?? 0).toLocaleString();
}

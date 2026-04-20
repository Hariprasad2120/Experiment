import SideBar, { SidebarItem } from "@/components/sidebar/SideBar";
import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  LifeBuoy,
  Package,
  Receipt,
  Settings,
  UserCircle,
} from "lucide-react";
import React from "react";

const Admin = () => {
  return (
    <div>
      <SideBar>
        <SidebarItem
          icon={<LayoutDashboard size={20} />}
          text="Dashboard"
          alert
        />
        <SidebarItem icon={<BarChart3 size={20} />} text="Statistics" />
        <SidebarItem icon={<UserCircle size={20} />} text="Users" />
        <SidebarItem icon={<Boxes size={20} />} text="Inventory" />
        <SidebarItem icon={<Package size={20} />} text="Orders" />
        <SidebarItem icon={<Receipt size={20} />} text="Billings" />
        <hr className="my-3 border-gray-300" />
        <SidebarItem icon={<Settings size={20} />} text="Settings" />
        <SidebarItem icon={<LifeBuoy size={20} />} text="Help" />
      </SideBar>
    </div>
  );
};

export default Admin;

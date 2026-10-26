import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Shield } from 'lucide-react';
import UsersTab from '@/components/admin/UsersTab';
import RevenueTab from '@/components/admin/RevenueTab';
import RequestsTab from '@/components/admin/RequestsTab';
import AttacksTab from '@/components/admin/AttacksTab';
import SystemTab from '@/components/admin/SystemTab';
import SettingsTab from '@/components/admin/SettingsTab';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-8 h-8 text-blue-500" />
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-gray-400">Manage users, revenue, and system health</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-gray-900 border border-gray-800">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="requests">Requests</TabsTrigger>
            <TabsTrigger value="attacks">Attacks</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UsersTab />
          </TabsContent>

          <TabsContent value="revenue">
            <RevenueTab />
          </TabsContent>

          <TabsContent value="requests">
            <RequestsTab />
          </TabsContent>

          <TabsContent value="attacks">
            <AttacksTab />
          </TabsContent>

          <TabsContent value="system">
            <SystemTab />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

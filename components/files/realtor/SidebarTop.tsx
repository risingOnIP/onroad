import { SidebarHeader} from '@/components/ui/sidebar'
import { LayoutDashboard } from 'lucide-react'
import React from 'react'

interface SidebarTopProps {
  display: string
}

const SidebarTop = ({display} : SidebarTopProps) => {
  return (
    <SidebarHeader className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
      <div className="flex items-center space-x-3">
        <LayoutDashboard className="w-6 h-6 text-blue-500" />
        <span className="text-xl font-bold text-gray-800">{display}</span>
      </div>
    </SidebarHeader>
  )
} 

export default SidebarTop

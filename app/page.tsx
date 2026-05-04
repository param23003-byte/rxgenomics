"use client"

import { useState } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { MetricCards } from "@/components/dashboard/metric-cards"
import { DrugSearch } from "@/components/dashboard/drug-search"
import { InteractionAlert } from "@/components/dashboard/interaction-alert"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

interface Drug {
  name: string
  category: string
  genes: string[]
}

export default function DashboardPage() {
  const [selectedDrug, setSelectedDrug] = useState<string | null>(null)

  const handleDrugSelect = (drug: Drug) => {
    setSelectedDrug(drug.name)
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-card px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Patient Search</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="flex-1 overflow-auto bg-background">
          <div className="container max-w-7xl py-6 px-4 md:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight text-foreground text-balance">
                Pharmacogenomics Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Clinical decision support for drug-gene interactions
              </p>
            </div>

            <div className="space-y-6">
              <MetricCards />

              <div className="grid gap-6 lg:grid-cols-2">
                <DrugSearch onDrugSelect={handleDrugSelect} />
                <InteractionAlert selectedDrug={selectedDrug} />
              </div>
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

"use client"

import { useState } from "react"
import { Search, Pill } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Drug {
  name: string
  category: string
  genes: string[]
}

const drugDatabase: Drug[] = [
  { name: "Clopidogrel", category: "Antiplatelet", genes: ["CYP2C19"] },
  { name: "Warfarin", category: "Anticoagulant", genes: ["CYP2C9", "VKORC1"] },
  { name: "Codeine", category: "Opioid Analgesic", genes: ["CYP2D6"] },
  { name: "Simvastatin", category: "Statin", genes: ["SLCO1B1"] },
  { name: "Tamoxifen", category: "Antineoplastic", genes: ["CYP2D6"] },
  { name: "Abacavir", category: "Antiretroviral", genes: ["HLA-B*57:01"] },
  { name: "Carbamazepine", category: "Anticonvulsant", genes: ["HLA-B*15:02", "HLA-A*31:01"] },
  { name: "Azathioprine", category: "Immunosuppressant", genes: ["TPMT", "NUDT15"] },
  { name: "Mercaptopurine", category: "Antineoplastic", genes: ["TPMT", "NUDT15"] },
  { name: "Tacrolimus", category: "Immunosuppressant", genes: ["CYP3A5"] },
]

interface DrugSearchProps {
  onDrugSelect: (drug: Drug) => void
}

export function DrugSearch({ onDrugSelect }: DrugSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)

  const filteredDrugs = drugDatabase.filter(
    (drug) =>
      drug.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drug.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDrugSelect = (drug: Drug) => {
    setSearchQuery(drug.name)
    setShowSuggestions(false)
    onDrugSelect(drug)
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Pill className="h-5 w-5 text-primary" />
          Drug-Gene Interaction Lookup
        </CardTitle>
        <CardDescription>
          Search for drugs to view pharmacogenomic guidelines and interactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Enter drug name (e.g., Clopidogrel, Warfarin)"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setShowSuggestions(true)
                }}
                onFocus={() => setShowSuggestions(true)}
                className="pl-10 bg-background"
              />
            </div>
            <Button
              onClick={() => {
                const drug = drugDatabase.find(
                  (d) => d.name.toLowerCase() === searchQuery.toLowerCase()
                )
                if (drug) onDrugSelect(drug)
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Search
            </Button>
          </div>

          {showSuggestions && searchQuery && filteredDrugs.length > 0 && (
            <div className="absolute z-10 mt-2 w-full rounded-lg border border-border bg-card shadow-lg">
              <ul className="max-h-60 overflow-auto py-2">
                {filteredDrugs.map((drug) => (
                  <li key={drug.name}>
                    <button
                      className="flex w-full items-center justify-between px-4 py-2 text-left hover:bg-accent transition-colors"
                      onClick={() => handleDrugSelect(drug)}
                    >
                      <div>
                        <p className="font-medium text-foreground">{drug.name}</p>
                        <p className="text-sm text-muted-foreground">{drug.category}</p>
                      </div>
                      <div className="flex gap-1">
                        {drug.genes.slice(0, 2).map((gene) => (
                          <Badge key={gene} variant="secondary" className="text-xs">
                            {gene}
                          </Badge>
                        ))}
                        {drug.genes.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{drug.genes.length - 2}
                          </Badge>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {showSuggestions && searchQuery && filteredDrugs.length === 0 && (
            <div className="absolute z-10 mt-2 w-full rounded-lg border border-border bg-card p-4 shadow-lg">
              <p className="text-sm text-muted-foreground text-center">
                No drugs found matching your search
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">Quick search:</span>
          {["Clopidogrel", "Warfarin", "Codeine", "Simvastatin"].map((drug) => (
            <button
              key={drug}
              onClick={() => {
                const drugData = drugDatabase.find((d) => d.name === drug)
                if (drugData) handleDrugSelect(drugData)
              }}
              className="text-sm text-primary hover:underline"
            >
              {drug}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

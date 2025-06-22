
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Award, Plus, Calendar, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Certificate {
  id: string
  name: string
  issuer: string
  dateEarned: string
  expiryDate?: string
  credentialUrl?: string
  skills: string[]
  status: "active" | "expired" | "pending"
}

export function CertificateTracker() {
  const [certificates, setCertificates] = useState<Certificate[]>([
    {
      id: "1",
      name: "AWS Certified Solutions Architect",
      issuer: "Amazon Web Services",
      dateEarned: "2023-06-15",
      expiryDate: "2026-06-15",
      credentialUrl: "https://aws.amazon.com/verification",
      skills: ["AWS", "Cloud Architecture", "System Design"],
      status: "active"
    },
    {
      id: "2", 
      name: "React Developer Certification",
      issuer: "Meta",
      dateEarned: "2023-03-10",
      skills: ["React", "JavaScript", "Frontend Development"],
      status: "active"
    }
  ])
  
  const [isAddingCert, setIsAddingCert] = useState(false)
  const [newCert, setNewCert] = useState({
    name: "",
    issuer: "",
    dateEarned: "",
    expiryDate: "",
    credentialUrl: "",
    skills: ""
  })
  const { toast } = useToast()

  const addCertificate = () => {
    if (!newCert.name || !newCert.issuer || !newCert.dateEarned) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    const certificate: Certificate = {
      id: Date.now().toString(),
      name: newCert.name,
      issuer: newCert.issuer,
      dateEarned: newCert.dateEarned,
      expiryDate: newCert.expiryDate || undefined,
      credentialUrl: newCert.credentialUrl || undefined,
      skills: newCert.skills.split(",").map(s => s.trim()).filter(s => s),
      status: "active"
    }

    setCertificates([...certificates, certificate])
    setNewCert({
      name: "",
      issuer: "",
      dateEarned: "",
      expiryDate: "",
      credentialUrl: "",
      skills: ""
    })
    setIsAddingCert(false)
    toast({
      title: "Certificate added",
      description: "Your certificate has been added to your tracker.",
    })
  }

  const getStatusColor = (status: Certificate["status"]) => {
    switch (status) {
      case "active": return "bg-green-600"
      case "expired": return "bg-red-600"
      case "pending": return "bg-yellow-600"
      default: return "bg-gray-600"
    }
  }

  return (
    <Card className="bg-gray-900/50 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center text-purple-400">
              <Award className="w-6 h-6 mr-2" />
              Certificate Tracker
            </CardTitle>
            <CardDescription>
              Manage your professional certifications and credentials
            </CardDescription>
          </div>
          <Dialog open={isAddingCert} onOpenChange={setIsAddingCert}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Certificate
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-white">Add New Certificate</DialogTitle>
                <DialogDescription>
                  Add a new certification to your profile
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cert-name">Certificate Name *</Label>
                  <Input
                    id="cert-name"
                    value={newCert.name}
                    onChange={(e) => setNewCert({...newCert, name: e.target.value})}
                    placeholder="e.g., AWS Certified Solutions Architect"
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="cert-issuer">Issuing Organization *</Label>
                  <Input
                    id="cert-issuer"
                    value={newCert.issuer}
                    onChange={(e) => setNewCert({...newCert, issuer: e.target.value})}
                    placeholder="e.g., Amazon Web Services"
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cert-date">Date Earned *</Label>
                    <Input
                      id="cert-date"
                      type="date"
                      value={newCert.dateEarned}
                      onChange={(e) => setNewCert({...newCert, dateEarned: e.target.value})}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cert-expiry">Expiry Date</Label>
                    <Input
                      id="cert-expiry"
                      type="date"
                      value={newCert.expiryDate}
                      onChange={(e) => setNewCert({...newCert, expiryDate: e.target.value})}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="cert-url">Credential URL</Label>
                  <Input
                    id="cert-url"
                    value={newCert.credentialUrl}
                    onChange={(e) => setNewCert({...newCert, credentialUrl: e.target.value})}
                    placeholder="https://..."
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="cert-skills">Related Skills (comma-separated)</Label>
                  <Input
                    id="cert-skills"
                    value={newCert.skills}
                    onChange={(e) => setNewCert({...newCert, skills: e.target.value})}
                    placeholder="e.g., AWS, Cloud Architecture, System Design"
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
                <Button onClick={addCertificate} className="w-full bg-purple-600 hover:bg-purple-700">
                  Add Certificate
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {certificates.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            No certificates added yet. Click "Add Certificate" to get started.
          </p>
        ) : (
          <div className="space-y-4">
            {certificates.map((cert) => (
              <div key={cert.id} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-semibold text-white">{cert.name}</h4>
                      <Badge className={getStatusColor(cert.status)}>
                        {cert.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">Issued by {cert.issuer}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        Earned: {new Date(cert.dateEarned).toLocaleDateString()}
                      </span>
                      {cert.expiryDate && (
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          Expires: {new Date(cert.expiryDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {cert.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {cert.skills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  {cert.credentialUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-400 hover:text-blue-300"
                      onClick={() => window.open(cert.credentialUrl, "_blank")}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

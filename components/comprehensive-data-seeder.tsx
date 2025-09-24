"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Users, Calendar, RefreshCw } from "lucide-react";

export function ComprehensiveDataSeeder() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("");

  const cleanAndSeedData = async () => {
    setLoading(true);
    setStatus("Starting data cleanup and seeding...");

    try {
      // Step 1: Clean up existing data
      setStatus("🗑️ Cleaning up existing data...");
      const cleanupResponse = await fetch("/api/cleanup-data", {
        method: "DELETE",
      });

      if (!cleanupResponse.ok) {
        throw new Error("Failed to cleanup data");
      }

      const cleanupResult = await cleanupResponse.json();
      console.log("Cleanup result:", cleanupResult);
      setStatus(`✅ Cleaned up ${cleanupResult.details?.totalDocumentsDeleted || 0} documents`);

      // Step 2: Create new tutors
      await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay
      setStatus("👨‍🏫 Creating new tutors...");
      
      const tutorsResponse = await fetch("/api/seed-tutors", {
        method: "POST",
      });

      if (!tutorsResponse.ok) {
        throw new Error("Failed to seed tutors");
      }

      const tutorsResult = await tutorsResponse.json();
      console.log("Tutors result:", tutorsResult);
      setStatus(`✅ Created ${tutorsResult.tutors?.length || 0} tutors`);

      // Step 3: Create availability for all tutors
      await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay
      setStatus("📅 Creating availability schedules (3 weeks ahead)...");

      const availabilityResponse = await fetch("/api/seed-all-availability?count=20", {
        method: "POST",
      });

      if (!availabilityResponse.ok) {
        throw new Error("Failed to seed availability");
      }

      const availabilityResult = await availabilityResponse.json();
      console.log("Availability result:", availabilityResult);
      
      const totalSlots = availabilityResult.results?.reduce(
        (sum: number, r: any) => sum + (r.slotsCreated || 0), 
        0
      ) || 0;

      setStatus(`✅ Database fully seeded! Created ${tutorsResult.tutors?.length || 0} tutors with ${totalSlots} availability slots`);

      // Auto-refresh the page after 2 seconds to show new data
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error: any) {
      console.error("Error in comprehensive seeding:", error);
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center space-x-2">
          <RefreshCw className="h-5 w-5" />
          <span>Data Management</span>
        </CardTitle>
        <CardDescription>
          Clean existing data and create fresh tutors with 3 weeks of availability
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <Trash2 className="h-4 w-4" />
            <span>Remove all existing tutors & availability</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Create 6 new tutors with profiles</span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Generate 20 availability slots per tutor</span>
          </div>
        </div>

        {status && (
          <div className="p-3 bg-muted rounded-lg text-sm">
            <div className="font-medium">Status:</div>
            <div>{status}</div>
          </div>
        )}

        <Button 
          onClick={cleanAndSeedData} 
          disabled={loading}
          className="w-full"
          variant={loading ? "secondary" : "default"}
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Clean & Seed Database
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
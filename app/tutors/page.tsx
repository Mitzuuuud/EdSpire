"use client";

import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/navbar";
import { TutorCard } from "@/components/tutor-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Users } from "lucide-react";
import { motion } from "framer-motion";
import { listTutorsWithStatus, TutorWithStatus } from "@/src/lib/services/availabilityService";
import { ComprehensiveDataSeeder } from "@/components/comprehensive-data-seeder";

// Type for the tutor card format
interface TutorCardData {
  id: string;
  name: string;
  avatar: string;
  subjects: string[];
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  availability: "available" | "busy" | "offline";
  nextAvailable?: string;
  specialties: string[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.22, staggerChildren: 0.1 } as const },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.25, 0.1, 0.25, 1.0] } as const },
} as const;

export default function TutorsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [tutors, setTutors] = useState<TutorWithStatus[]>([]);
  const [loading, setLoading] = useState(true);

  // Load tutors + compute availability
  useEffect(() => {
    let live = true;
    (async () => {
      setLoading(true);
      try {
        const data = await listTutorsWithStatus();
        console.log("Raw tutors data:", data);
        console.log("Number of tutors:", data.length);
        if (live) setTutors(data);
      } finally {
        if (live) setLoading(false);
      }
    })();

    // refresh every minute to keep :00/:30 changes accurate
    const timer = setInterval(async () => {
      try {
        const data = await listTutorsWithStatus();
        setTutors(data);
      } catch {}
    }, 60_000);

    return () => { live = false; clearInterval(timer); };
  }, []);

  const filteredTutors = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return tutors.filter((tutor) => {
      const matchesSearch =
        (tutor.name ?? "").toLowerCase().includes(q) ||
        (tutor.subjects ?? []).some((s: string) => s.toLowerCase().includes(q));

      const matchesSubject =
        subjectFilter === "all" ||
        (tutor.subjects ?? []).some((s: string) => s.toLowerCase().includes(subjectFilter.toLowerCase()));

      const matchesAvailability =
        availabilityFilter === "all" || tutor.availability === availabilityFilter;

      return matchesSearch && matchesSubject && matchesAvailability;
    });
  }, [tutors, searchQuery, subjectFilter, availabilityFilter]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <motion.main className="mx-auto w-full max-w-7xl px-6 py-8" variants={containerVariants} initial="hidden" animate="visible">
        <motion.div className="mb-8" variants={itemVariants}>
          <div className="flex items-center space-x-2 mb-2">
            <Users className="h-6 w-6 text-primary" />
            <h1 className="font-display text-3xl font-bold text-foreground">Find Your Tutor</h1>
          </div>
          <p className="text-muted-foreground">Connect with expert tutors across various subjects</p>
        </motion.div>

        {/* Search + Filters */}
        <motion.div className="mb-8 space-y-4" variants={itemVariants}>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search tutors or subjects..." value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <div className="flex gap-2">
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Subject" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  <SelectItem value="math">Mathematics</SelectItem>
                  <SelectItem value="physics">Physics</SelectItem>
                  <SelectItem value="chemistry">Chemistry</SelectItem>
                  <SelectItem value="biology">Biology</SelectItem>
                  <SelectItem value="computer">Computer Science</SelectItem>
                </SelectContent>
              </Select>
              <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Availability" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tutors</SelectItem>
                  <SelectItem value="available">Available Now</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {loading ? "Loading..." : `${filteredTutors.length} tutors found`}
              </span>
              {(searchQuery || subjectFilter !== "all" || availabilityFilter !== "all") && (
                <Button variant="ghost" size="sm"
                        onClick={() => { setSearchQuery(""); setSubjectFilter("all"); setAvailabilityFilter("all"); }}
                        className="text-xs">
                  Clear filters
                </Button>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                {tutors.filter((t) => t.availability === "available").length} Available
              </Badge>
            </div>
          </div>
        </motion.div>

        {/* Tutors Grid */}
        <motion.div className="flex justify-center" variants={containerVariants}>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTutors.map((tutor) => (
              <motion.div key={tutor.id} variants={itemVariants}>
                <TutorCard tutor={{
                  id: tutor.id,
                  name: tutor.name || "Tutor",
                  avatar: tutor.avatar || "/placeholder-user.jpg",
                  subjects: tutor.subjects || [],
                  rating: tutor.rating || 4.5,
                  reviewCount: tutor.reviewCount || 0,
                  hourlyRate: tutor.hourlyRate || 25,
                  availability: tutor.availability,
                  nextAvailable: tutor.nextAvailable,
                  specialties: tutor.specialties || []
                }} />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {!loading && tutors.length === 0 && (
          <motion.div className="text-center py-12" variants={itemVariants}>
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No tutors in database</h3>
            <p className="text-muted-foreground mb-4">Seed the database with sample data to get started</p>
            <ComprehensiveDataSeeder />
          </motion.div>
        )}

        {!loading && tutors.length > 0 && filteredTutors.length === 0 && (
          <motion.div className="text-center py-12" variants={itemVariants}>
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No tutors found</h3>
            <p className="text-muted-foreground mb-4">Try adjusting your search criteria</p>
            <Button variant="outline" onClick={() => { setSearchQuery(""); setSubjectFilter("all"); setAvailabilityFilter("all"); }}>
              Clear all filters
            </Button>
          </motion.div>
        )}
      </motion.main>
    </div>
  );
}

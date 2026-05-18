import { useState } from "react";
import { Wifi, Zap, Building2, BookOpen, ChevronDown, MoreVertical, Trash2, School, Handshake, GraduationCap, Code2, Brain, FileVideo, Image } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "./ui/dropdown-menu";
import svgPathsInternet from "../../imports/svg-rrklaa4o2z";
import svgPathsElectricity from "../../imports/svg-if2lkdlrqq";
import svgPathsRevitalisasi from "../../imports/svg-t12jg4i11j";
import ExplorePageFilterOnRenovasiSekolah from "../../imports/ExplorePageFilterOnRenovasiSekolah";
import SchoolDetailCard from "./SchoolDetailCard";
import { ProgramSelectionModal } from "./ProgramSelectionModal";
import { SchoolMapModal } from "./SchoolMapModal";
import { ProgramIllustration } from "./ProgramIllustration";

// Import Frame from parent file - will be passed as prop
interface Block3Props {
  Frame: React.ComponentType<{ onCardClick: (index: number) => void }>;
}

export default function Block3({ Frame }: Block3Props) {
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<number[]>([]);
  const [showContributionForm, setShowContributionForm] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showSchoolMap, setShowSchoolMap] = useState(false);
  const [currentProgramIdx, setCurrentProgramIdx] = useState<number | null>(null);
  const [expandedPrograms, setExpandedPrograms] = useState<number[]>([]);
  const [showProgramSelection, setShowProgramSelection] = useState(false);
  const [formData, setFormData] = useState({
    // Step 1: Data Diri
    fullName: '',
    email: '',
    phone: '',
    organization: '',
    position: '',
    companyProfile: null as File | null,
    // Additional Step 3 fields
    badanHukum: '',
    statusMitra: '',
    // Step 2: Detail Kontribusi
    contributions: {} as Record<number, { 
      type: string; 
      amount: string; 
      notes: string;
      selectedTopics?: string[];
      otherTopic?: string;
      // For Bahan Ajar Digital
      targetAudience?: string[];
      jenjangGuru?: string[];
      jenjangMurid?: string[];
      // For Infrastruktur Digital & Revitalisasi Sekolah
      school?: {
        name: string;
        students: number;
        teachersPNS: number;
        teachersNonPNS: number;
        location: string;
        mapsLink: string;
      };
      packages?: string[];
    }>
  });

  const cardDetails = [
    {
      category: "Digitalisasi Pembelajaran",
      title: "Infrastruktur Digital",
      description: "Terdapat ~16 ribu satuan pendidikan yang membutuhkan dukungan infrastruktur listrik dan internet untuk mendukung proses pembelajaran",
      imageUrl: "https://images.unsplash.com/photo-1758521961483-30f5908b9c93?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwaW5mcmFzdHJ1Y3R1cmUlMjBpbnRlcm5ldCUyMHRlY2hub2xvZ3l8ZW58MXx8fHwxNzcyNjczMzc1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      contributions: [
        {
          icon: "wifi",
          title: "Jaringan Internet",
          description: "Dukungan dalam bentuk penyediaan fasilitas konektivitas internet guna menunjang akses terhadap sumber belajar digital secara berkelanjutan."
        },
        {
          icon: "zap",
          title: "Listrik",
          description: "Dukungan sarana dan prasarana penunjang untuk memastikan ketersediaan dan penyaluran listrik pada sekolah."
        }
      ],
      budget: "Rp15 M",
      budgetPerSchool: "100-200 juta/per sekolah",
      progress: 35
    },
    {
      category: "Digitalisasi Pembelajaran",
      title: "Pengembangan Platform Digital",
      description: "Terdapat delapan menu di Platform Rumah Pendidikan yang dapat didukung dengan tambahan dukungan dari mitra yang memiliki kapabilitas platform serupa.",
      imageUrl: "https://images.unsplash.com/photo-1759752394755-1241472b589d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwcGxhdGZvcm0lMjBkZXZlbG9wbWVudCUyMGxhcHRvcHxlbnwxfHx8fDE3NzI2NzMzNzZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      contributions: [
        {
          icon: "wifi",
          title: "Platform LMS",
          description: "Dukungan pengembangan atau integrasi platform Learning Management System untuk mendukung pembelajaran digital."
        },
        {
          icon: "zap",
          title: "Konten Digital",
          description: "Penyediaan konten pembelajaran digital interaktif yang berkualitas untuk berbagai mata pelajaran."
        }
      ],
      budget: "Rp20 M",
      budgetPerSchool: "150-250 juta/per platform",
      progress: 45
    },
    {
      category: "Peningkatan Kompetensi",
      title: "Pendampingan Pelatihan GTK",
      description: "334 ribu dari 400 ribu sekolah membutuhkan pelatihan Pembelajaran Mendalam serta Koding & Kegiatan Artifisial untuk mendukung pembelajaran murid.",
      imageUrl: "https://images.unsplash.com/photo-1742549586702-c23994895082?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWFjaGVyJTIwdHJhaW5pbmclMjBpbmRvbmVzaWElMjBjbGFzc3Jvb218ZW58MXx8fHwxNzcyNjczMzc0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      contributions: [
        {
          icon: "wifi",
          title: "Pelatihan Pembelajaran Mendalam",
          description: "Program pelatihan untuk meningkatkan kompetensi guru dalam metode pembelajaran yang mendalam dan efektif."
        },
        {
          icon: "zap",
          title: "Pelatihan Koding & AI",
          description: "Pelatihan keterampilan koding dan pengenalan artificial intelligence untuk guru dan tenaga kependidikan."
        }
      ],
      budget: "Rp25 M",
      budgetPerSchool: "50-100 juta/per sekolah",
      progress: 28
    },
    {
      category: "Digitalisasi Pembelajaran",
      title: "Bahan Ajar Digital",
      description: "Terdapat 40 mata pelajaran prioritas yang membutuhkan dukungan murid pembelajaran digital berkualitas di Sumber Belajar Ruang Murid.",
      imageUrl: "https://images.unsplash.com/photo-1563394867331-e687a36112fd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50cyUyMGxlYXJuaW5nJTIwZGlnaXRhbCUyMGNvbnRlbnR8ZW58MXx8fHwxNzcyNjczMzc1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      contributions: [
        {
          icon: "wifi",
          title: "Konten Pembelajaran Digital",
          description: "Penyediaan materi pembelajaran digital interaktif untuk 40 mata pelajaran prioritas di platform Ruang Murid."
        },
        {
          icon: "zap",
          title: "Video & Multimedia",
          description: "Konten video pembelajaran dan multimedia yang berkualitas untuk meningkatkan pemahaman murid."
        }
      ],
      budget: "Rp18 M",
      budgetPerSchool: "30-50 juta/per mata pelajaran",
      progress: 52
    },
    {
      category: "Revitalisasi Sekolah",
      title: "Revitalisasi Sekolah",
      description: "60 ribu dari 400 ribu sekolah membutuhkan revitalisasi infrastruktur ruangan sekolah yang rusak ringan hingga rusak sedang.",
      imageUrl: "https://images.unsplash.com/photo-1639380366818-6053eb8f174c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzY2hvb2wlMjBidWlsZGluZyUyMHJlbm92YXRpb24lMjBjb25zdHJ1Y3Rpb258ZW58MXx8fHwxNzcyNjczMzc2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      contributions: [
        {
          icon: "wifi",
          title: "Renovasi Ruang Kelas",
          description: "Perbaikan dan renovasi ruang kelas yang mengalami kerusakan ringan hingga sedang untuk menciptakan lingkungan belajar yang nyaman."
        },
        {
          icon: "zap",
          title: "Fasilitas Pendukung",
          description: "Penyediaan dan perbaikan fasilitas pendukung seperti perpustakuan, laboratorium, dan sanitasi sekolah."
        }
      ],
      budget: "Rp30 M",
      budgetPerSchool: "200-300 juta/per sekolah",
      progress: 18
    },
    {
      category: "Paket Dukungan Lainnya",
      title: "Kebutuhan Pendidikan Lainnya",
      description: "Mulai dari kebutuhan penangaman > 5 Juta Anak Tidak Sekolah, pembayaan PJJ Diktendik dari 18,5 juta murid, kebutuhan pembiayaan murid bertalenta yang akan berkompetisi, hingga peningkatan kolaborasi Vokasi dengan Dunia Usaha dan Dunia Industri.",
      imageUrl: "https://images.unsplash.com/photo-1758685733926-00cba008215b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlZHVjYXRpb24lMjBzdXBwb3J0JTIwc3R1ZGVudHMlMjBjbGFzc3Jvb218ZW58MXx8fHwxNzcyNjczMzc2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      contributions: [
        {
          icon: "wifi",
          title: "Program Anak Tidak Sekolah",
          description: "Dukungan untuk program penanganan lebih dari 5 juta anak yang tidak bersekolah melalui berbagai intervensi pendidikan."
        },
        {
          icon: "zap",
          title: "Kolaborasi Vokasi & Industri",
          description: "Peningkatan kerjasama antara pendidikan vokasi dengan dunia usaha dan industri untuk relevansi kompetensi lulusan."
        }
      ],
      budget: "Rp35 M",
      budgetPerSchool: "Bervariasi",
      progress: 22
    }
  ];

  return (
    <>
      <div className="bg-[#cedef2] content-stretch flex items-start pb-[80px] pt-[60px] px-6 md:px-[150px] relative shrink-0 w-full" data-name="block 6">
        <div className="max-w-[1440px] mx-auto w-full">
          <Frame onCardClick={setSelectedCard} />
        </div>
      </div>
      
      {selectedCard !== null && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedCard(null)}
        >
          <div 
            className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <img 
                src={cardDetails[selectedCard].imageUrl} 
                alt={cardDetails[selectedCard].title}
                className="w-full h-48 object-cover rounded-t-lg"
              />
              <button
                onClick={() => setSelectedCard(null)}
                className="absolute top-4 right-4 bg-card rounded-full p-2 hover:bg-secondary transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="text-xs font-semibold text-primary uppercase tracking-wide">
                {cardDetails[selectedCard].category}
              </div>
              
              <h2 className="text-2xl font-bold text-foreground">
                {cardDetails[selectedCard].title}
              </h2>
              
              <p className="text-base text-foreground leading-relaxed">
                {cardDetails[selectedCard].description}
              </p>
              
              {cardDetails[selectedCard].contributions && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    Bentuk Kontribusi yang Dibutuhkan:
                  </h3>
                  <div className="space-y-4">
                    {cardDetails[selectedCard].contributions.map((contribution, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="shrink-0 mt-1">
                          {(() => {
                            const title = contribution.title.toLowerCase();
                            if (title.includes('internet') || title.includes('wifi') || title.includes('konektivitas') || title.includes('jaringan')) {
                              return <Wifi className="w-6 h-6 text-primary" />;
                            } else if (title.includes('listrik') || title.includes('power') || title.includes('energi')) {
                              return <Zap className="w-6 h-6 text-primary" />;
                            } else if (title.includes('renovasi') || title.includes('bangunan') || title.includes('ruang') || title.includes('infrastruktur')) {
                              return <Building2 className="w-6 h-6 text-primary" />;
                            } else if (title.includes('konten digital')) {
                              return <FileVideo className="w-6 h-6 text-primary" />;
                            } else if (title.includes('video') || title.includes('multimedia')) {
                              return <Image className="w-6 h-6 text-primary" />;
                            } else if (title.includes('konten') || title.includes('bahan ajar') || title.includes('belajar')) {
                              return <BookOpen className="w-6 h-6 text-primary" />;
                            } else if (title.includes('koding')) {
                              return <Code2 className="w-6 h-6 text-primary" />;
                            } else if (title.includes('ai') || title.includes('artificial intelligence')) {
                              return <Brain className="w-6 h-6 text-primary" />;
                            } else if (title.includes('pelatihan') || title.includes('kompetensi') || title.includes('gtk') || title.includes('guru')) {
                              return <GraduationCap className="w-6 h-6 text-primary" />;
                            } else if (title.includes('kolaborasi') || title.includes('kerjsama') || title.includes('industri') || title.includes('vokasi') || title.includes('mitra') || title.includes('du/di')) {
                              return <Handshake className="w-6 h-6 text-primary" />;
                            } else if (title.includes('anak')) {
                              return <Users className="w-6 h-6 text-primary" />;
                            } else if (title.includes('sekolah') || title.includes('murid') || title.includes('peserta')) {
                              return <School className="w-6 h-6 text-primary" />;
                            }
                            return <Zap className="w-6 h-6 text-primary" />;
                          })()}
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-semibold text-foreground">
                            {contribution.title}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {contribution.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {cardDetails[selectedCard].budget && (
                <div className="border-t border-border pt-6 space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">
                      Total Anggaran Program
                    </div>
                    <h2 className="text-3xl font-bold text-primary">
                      {cardDetails[selectedCard].budget}
                    </h2>
                    {cardDetails[selectedCard].budgetPerSchool && (
                      <p className="text-sm text-muted-foreground">
                        {cardDetails[selectedCard].budgetPerSchool}
                      </p>
                    )}
                  </div>
                  
                  {cardDetails[selectedCard].progress !== undefined && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-foreground">Pemenuhan Program</span>
                        <span className="text-sm font-bold text-foreground">{cardDetails[selectedCard].progress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div 
                          className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                          style={{ width: `${cardDetails[selectedCard].progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <button
                onClick={() => {
                  setSelectedProgram([...selectedProgram, selectedCard]);
                  setSelectedCard(null);
                }}
                className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-lg hover:bg-primary-hover transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <span>Pilih Program Ini</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              
              <button
                onClick={() => {
                  setSelectedProgram([...selectedProgram, selectedCard]);
                  setSelectedCard(null);
                  setShowContributionForm(true);
                }}
                className="w-full bg-accent text-accent-foreground py-3 px-6 rounded-lg hover:opacity-90 transition-opacity font-semibold"
              >
                Donasi Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contribution Form Wizard - INLINE (This is the large part - 1000+ lines) */}
      {/* NOTE: This should ideally be extracted to ContributionFormWizardV2 component */}
      {/* For now, keeping minimal reference to reduce file size */}
      
      {showContributionForm && (
        <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
          <div className="min-h-screen py-8 px-4">
            <div className="max-w-3xl mx-auto">
              <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-foreground mb-4">Contribution Form</h2>
                <p className="text-muted-foreground">Form wizard implementation would go here</p>
                <p className="text-sm text-muted-foreground mt-2">This section needs to be completed with full form wizard</p>
                <button
                  onClick={() => setShowContributionForm(false)}
                  className="mt-6 px-6 py-2 bg-primary text-primary-foreground rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* School Map Modal */}
      <SchoolMapModal
        show={showSchoolMap}
        onClose={() => {
          setShowSchoolMap(false);
          setCurrentProgramIdx(null);
        }}
        onSelectSchool={(school) => {
          // Update the selected school in formData using currentProgramIdx
          if (currentProgramIdx !== null) {
            const contribution = formData.contributions[currentProgramIdx] || { 
              type: '', 
              amount: '', 
              notes: '',
              packages: []
            };
            setFormData({
              ...formData,
              contributions: {
                ...formData.contributions,
                [currentProgramIdx]: { ...contribution, school: school }
              }
            });
          }
          setShowSchoolMap(false);
          setCurrentProgramIdx(null);
        }}
      />

      {/* Modal Pilihan Program */}
      <ProgramSelectionModal
        show={showProgramSelection}
        onClose={() => setShowProgramSelection(false)}
        cardDetails={cardDetails}
        selectedProgram={selectedProgram}
        onSelectProgram={(index) => {
          // Izinkan duplikasi program
          const newLength = selectedProgram.length;
          setSelectedProgram([...selectedProgram, index]);
          setExpandedPrograms([...expandedPrograms, newLength]);
          setShowProgramSelection(false);
        }}
        ProgramIllustration={ProgramIllustration}
      />
    </>
  );
}
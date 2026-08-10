import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { ContributionFormWizard } from "../components/ContributionFormWizard";
import { ProgramIllustration } from "../components/ProgramIllustration";
import { SchoolMapModal } from "../components/SchoolMapModal";
import { ProgramSelectionModal } from "../components/ProgramSelectionModal";
import { getMitraProfile, getMitraSession } from "../lib/mitra";
import imgInfrastrukturDigital from "../../assets/infrastrukturdigital.jpg";
import imgSumberBelajar from "../../assets/sumberbelajarmurid.jpg";
import imgRevitalisasiSekolah from "../../assets/revitalisasisekolah.jpg";
import imgPengembanganPlatform from "../../assets/platformdigital.jpg";
import imgPendampinganGTK from "../../assets/pelatihangtk.jpg";
import imgKebutuhanLainnya from "../../assets/pendidikanlainnya.jpg";

const cardDetails = [
  {
    imageUrl: imgInfrastrukturDigital,
    category: "KEBUTUHAN INFRASTRUKTUR",
    title: "Infrastruktur Digital",
    description: "Dukungan dalam bentuk penyediaan infrastruktur digital untuk meningkatkan akses terhadap teknologi informasi dan komunikasi di sekolah."
  },
  {
    imageUrl: imgPengembanganPlatform,
    category: "KEBUTUHAN TEKNOLOGI",
    title: "Pengembangan Platform Digital",
    description: "Dukungan dalam bentuk pengembangan platform pembelajaran digital yang inovatif untuk meningkatkan efektivitas pembelajaran."
  },
  {
    imageUrl: imgPendampinganGTK,
    category: "KEBUTUHAN PENGEMBANGAN SDM",
    title: "Pendampingan Pelatihan GTK",
    description: "Dukungan dalam bentuk pelatihan dan pendampingan untuk meningkatkan kompetensi guru dan tenaga kependidikan."
  },
  {
    imageUrl: imgSumberBelajar,
    category: "KEBUTUHAN PEMBELAJARAN",
    title: "Bahan Ajar Digital",
    description: "Dukungan dalam bentuk penyediaan materi pembelajaran yang berkualitas dan relevan untuk meningkatkan kualitas pembelajaran di sekolah."
  },
  {
    imageUrl: imgRevitalisasiSekolah,
    category: "KEBUTUHAN INFRASTRUKTUR",
    title: "Revitalisasi Sekolah",
    description: "Dukungan dalam bentuk renovasi dan pemeliharaan fasilitas sekolah untuk menciptakan lingkungan belajar yang nyaman dan kondusif."
  },
  {
    imageUrl: imgKebutuhanLainnya,
    category: "KEBUTUHAN UMUM",
    title: "Kebutuhan Pendidikan Lainnya",
    description: "Dukungan dalam bentuk kontribusi lainnya yang dapat meningkatkan kualitas pendidikan di Indonesia."
  }
];

export default function ContributionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedProgram, setSelectedProgram] = useState<number[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [showSchoolMap, setShowSchoolMap] = useState(false);
  const [currentProgramIdx, setCurrentProgramIdx] = useState<number | null>(null);
  const [currentSchoolIdx, setCurrentSchoolIdx] = useState<number | null>(null);
  const [expandedPrograms, setExpandedPrograms] = useState<number[]>([]);
  const [expandedSchools, setExpandedSchools] = useState<Record<string, boolean>>({});
  const [showProgramSelection, setShowProgramSelection] = useState(false);
  const [formData, setFormData] = useState<any>({
    fullName: "",
    organization: "",
    phone: "",
    email: "",
    contributions: {}
  });

  // Prefill data kontributor dari profil mitra yang sedang login
  useEffect(() => {
    const session = getMitraSession();
    if (!session) return;
    const profile = getMitraProfile(session.email);
    if (!profile) return;
    setFormData((prev: any) => {
      if (prev.fullName || prev.organization) return prev;
      return {
        ...prev,
        fullName: profile.nama,
        organization: profile.namaPerusahaan,
        position: profile.jabatan,
        phone: profile.nomorTelepon,
        email: profile.email,
        badanHukum: profile.badanHukum,
        statusMitra: profile.statusMitra,
      };
    });
  }, []);

  // Handle pre-selected program from landing page
  useEffect(() => {
    const state = location.state as { preSelectedProgram?: number; directToStep2?: boolean } | null;
    
    if (state?.preSelectedProgram !== undefined && state?.directToStep2) {
      const programIndex = state.preSelectedProgram;
      
      // Set selected program
      setSelectedProgram([programIndex]);
      
      // Initialize contribution for this program
      setFormData((prev: any) => ({
        ...prev,
        contributions: {
          0: {
            type: '',
            amount: '',
            notes: '',
            packages: [],
            schools: []
          }
        }
      }));
      
      // Set to step 2 and expand the program
      setCurrentStep(2);
      setExpandedPrograms([0]);
      
      // Clear navigation state to prevent re-triggering on page refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const programParam = queryParams.get('program');
    if (programParam) {
      const programIndex = parseInt(programParam, 10);
      if (!isNaN(programIndex) && programIndex >= 0 && programIndex < cardDetails.length) {
        setSelectedProgram([programIndex]);
        setExpandedPrograms([0]);
      }
    }
  }, [location.search]);

  const handleOpenSchoolMap = (programIdx: number, schoolIdx?: number) => {
    setCurrentProgramIdx(programIdx);
    setCurrentSchoolIdx(schoolIdx ?? null);
    setShowSchoolMap(true);
  };

  const handleSelectSchool = (school: any) => {
    console.log('🟢 handleSelectSchool DIPANGGIL dengan school:', school);
    console.log('🟢 currentProgramIdx:', currentProgramIdx);
    console.log('🟢 currentSchoolIdx:', currentSchoolIdx);
    
    if (currentProgramIdx !== null) {
      const contribution = formData.contributions[currentProgramIdx] || {
        type: '',
        amount: '',
        notes: '',
        packages: []
      };

      // Check if this is a multi-school program (Revitalisasi Sekolah or Infrastruktur Digital)
      const programIndex = selectedProgram[currentProgramIdx];
      const program = cardDetails[programIndex];
      const isRevitalisasiSekolah = program?.title === "Revitalisasi Sekolah";
      const isInfrastrukturDigital = program?.title === "Infrastruktur Digital";
      const isMultiSchoolProgram = isRevitalisasiSekolah || isInfrastrukturDigital;

      console.log('handleSelectSchool:', { 
        programTitle: program?.title,
        isRevitalisasiSekolah,
        isInfrastrukturDigital,
        isMultiSchoolProgram,
        currentSchoolIdx,
        school 
      });

      if (isMultiSchoolProgram) {
        // Multi-school support for Revitalisasi Sekolah & Infrastruktur Digital
        const currentSchools = contribution.schools || [];
        
        if (currentSchoolIdx !== null) {
          // Edit existing school
          const updatedSchools = [...currentSchools];
          updatedSchools[currentSchoolIdx] = {
            ...updatedSchools[currentSchoolIdx],
            school: school
          };
          const newFormData = {
            ...formData,
            contributions: {
              ...formData.contributions,
              [currentProgramIdx]: { ...contribution, schools: updatedSchools }
            }
          };
          console.log('Setting formData (edit):', newFormData);
          setFormData(newFormData);
        } else {
          // Add new school
          const newSchoolIdx = currentSchools.length;
          const newFormData = {
            ...formData,
            contributions: {
              ...formData.contributions,
              [currentProgramIdx]: { 
                ...contribution, 
                schools: [...currentSchools, { school: school, selectedBuildings: [], packages: [] }]
              }
            }
          };
          console.log('Setting formData (add new):', newFormData);
          setFormData(newFormData);
          
          // Auto-expand the newly added school
          setExpandedSchools(prev => ({
            ...prev,
            [`${currentProgramIdx}-${newSchoolIdx}`]: true
          }));
        }
      } else {
        // Single school for other programs
        setFormData({
          ...formData,
          contributions: {
            ...formData.contributions,
            [currentProgramIdx]: { ...contribution, school: school }
          }
        });
      }
    }
    setShowSchoolMap(false);
    setCurrentProgramIdx(null);
    setCurrentSchoolIdx(null);
  };

  return (
    <div className="bg-default min-h-screen">
      <ContributionFormWizard
        show={true}
        selectedProgram={selectedProgram}
        setSelectedProgram={setSelectedProgram}
        cardDetails={cardDetails}
        formData={formData}
        setFormData={setFormData}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        onClose={() => {
          navigate("/");
        }}
        onOpenSchoolMap={handleOpenSchoolMap}
        onOpenProgramSelection={() => setShowProgramSelection(true)}
        expandedPrograms={expandedPrograms}
        setExpandedPrograms={setExpandedPrograms}
        expandedSchools={expandedSchools}
        setExpandedSchools={setExpandedSchools}
        ProgramIllustration={ProgramIllustration}
        skipDataDiri={!!getMitraSession()}
      />

      {/* School Map Modal */}
      <SchoolMapModal
        show={showSchoolMap}
        onClose={() => {
          setShowSchoolMap(false);
          setCurrentProgramIdx(null);
          setCurrentSchoolIdx(null);
        }}
        onSelectSchool={handleSelectSchool}
      />

      {/* Modal Pilihan Program */}
      <ProgramSelectionModal
        show={showProgramSelection}
        onClose={() => setShowProgramSelection(false)}
        cardDetails={cardDetails}
        selectedProgram={selectedProgram}
        onSelectProgram={(index) => {
          const newLength = selectedProgram.length;
          setSelectedProgram([...selectedProgram, index]);
          setExpandedPrograms([...expandedPrograms, newLength]);
          setShowProgramSelection(false);
        }}
        ProgramIllustration={ProgramIllustration}
      />
    </div>
  );
}
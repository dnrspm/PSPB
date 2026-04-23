import React, { useState, useEffect } from "react";
import { ChevronDown, MoreVertical, Trash2, ArrowLeft, GraduationCap, School, ClipboardCheck, ArrowRight, Plus, File } from "lucide-react";
import { FormInput } from "./FormInput";
import { FileUpload } from "./FileUpload";
import { PackageCheckbox } from "./PackageCheckbox";
import { PackageCheckboxDetailed } from "./PackageCheckboxDetailed";
import { RevitalizationBuildingCard } from "./RevitalizationBuildingCard";
import { InfrastructurePackageSelector } from "./InfrastructurePackageSelector";
import { infrastructurePackages, revitalizationBuildings } from "../data/packageData";
import { getProgramContent } from "../data/contributionContent";
import { Select } from "./Select";
import { ContributionPrerequisites } from "./ContributionPrerequisites";
import { Checkbox } from "./ui/checkbox";
import svgPathsInternet from "../../imports/svg-rrklaa4o2z";
import svgPathsElectricity from "../../imports/svg-if2lkdlrqq";
import imgTerimaKasih from "../../assets/terimakasih.jpg";
import svgPathsRevitalisasi from "../../imports/svg-t12jg4i11j";
import { SimpleDropdownMenu, SimpleDropdownMenuItem } from "./SimpleDropdownMenu";

// Updated: 2026-03-08 - Added multi-school support for Revitalisasi Sekolah

// Helper to filter Figma props from button
const FilteredButton = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>((props, ref) => {
  const cleanProps = { ...props };
  // Remove Figma inspection props
  Object.keys(cleanProps).forEach(key => {
    if (key.toLowerCase().startsWith('_fg')) {
      delete (cleanProps as any)[key];
    }
  });
  return <button ref={ref} {...cleanProps} />;
});
FilteredButton.displayName = "FilteredButton";

interface ProgramIllustrationProps {
  title: string;
}

interface ContributionFormWizardProps {
  show: boolean;
  selectedProgram: number[];
  setSelectedProgram: (programs: number[]) => void;
  cardDetails: any[];
  formData: any;
  setFormData: (data: any) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  onClose: () => void;
  onOpenSchoolMap: (idx: number, schoolIdx?: number) => void;
  onOpenProgramSelection: () => void;
  expandedPrograms: number[];
  setExpandedPrograms: (programs: number[] | ((prev: number[]) => number[])) => void;
  expandedSchools: Record<string, boolean>;
  setExpandedSchools: (schools: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;
  ProgramIllustration: React.ComponentType<ProgramIllustrationProps>;
}

export function ContributionFormWizard({
  show,
  selectedProgram,
  setSelectedProgram,
  cardDetails,
  formData,
  setFormData,
  currentStep,
  setCurrentStep,
  onClose,
  onOpenSchoolMap,
  onOpenProgramSelection,
  expandedPrograms,
  setExpandedPrograms,
  expandedSchools,
  setExpandedSchools,
  ProgramIllustration
}: ContributionFormWizardProps) {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);
  const [showThankYou, setShowThankYou] = useState(false);
  const [expandedPrasyarat, setExpandedPrasyarat] = useState<Record<string, boolean>>({guru: true, murid: true, 'sso-belajar-id': true, 'integrasi-rumah-pendidikan': true, 'default': true});

  // Debug: Log formData changes
  useEffect(() => {
    console.log('[FormData Changed] Full contributions state:', 
      Object.entries(formData.contributions).map(([idx, contrib]: [string, any]) => ({
        programIdx: idx,
        schoolsCount: contrib.schools?.length || 0,
        schools: contrib.schools?.map((s: any) => ({
          npsn: s.school.npsn,
          name: s.school.name,
          packages: s.packages,
          selectedBuildings: s.selectedBuildings
        }))
      }))
    );
  }, [formData.contributions]);

  if (!show) return null;

  const handleNext = () => {
    if (currentStep < 4) {
      // When moving from Step 1 to Step 2 (Detail Kontribusi), expand all selected programs and schools
      if (currentStep === 1) {
        setExpandedPrograms(selectedProgram.map((_, idx) => idx));
        
        // Expand all schools by default
        const allSchools: Record<string, boolean> = {};
        selectedProgram.forEach((programIndex, idx) => {
          const contribution = formData.contributions[idx];
          if (contribution?.schools?.length > 0) {
            contribution.schools.forEach((_: any, schoolIdx: number) => {
              allSchools[`${idx}-${schoolIdx}`] = true;
            });
          }
        });
        setExpandedSchools(allSchools);
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    console.log('Form submitted:', formData);
    setShowThankYou(true);
  };

  const handleBackToHome = () => {
    setShowThankYou(false);
    setCurrentStep(1);
    onClose();
  };

  const handlePackageChange = (idx: number, packageType: string, checked: boolean) => {
    const contribution = formData.contributions[idx] || { packages: [] };
    const currentPackages = contribution.packages || [];
    const newPackages = checked
      ? [...currentPackages, packageType]
      : currentPackages.filter((p: string) => p !== packageType);
    
    setFormData({
      ...formData,
      contributions: {
        ...formData.contributions,
        [idx]: { ...contribution, packages: newPackages }
      }
    });
  };

  // Handler for Infrastructure Digital package changes
  const handleInfrastructurePackageChange = (programIdx: number, schoolIdx: number, packageKey: string, checked: boolean) => {
    console.log(`[handleInfrastructurePackageChange] Program ${programIdx}, School ${schoolIdx}, Package ${packageKey}, checked=${checked}`);
    
    setFormData((prevFormData: any) => {
      const prevContribution = prevFormData.contributions[programIdx];
      if (!prevContribution || !prevContribution.schools || !prevContribution.schools[schoolIdx]) {
        console.error(`[handleInfrastructurePackageChange] Invalid state`);
        return prevFormData;
      }
      
      const updatedSchools = [...prevContribution.schools];
      const currentPackages = updatedSchools[schoolIdx].packages || [];
      const newPackages = checked
        ? [...currentPackages, packageKey]
        : currentPackages.filter((id: string) => id !== packageKey);
      
      console.log(`[handleInfrastructurePackageChange] School ${schoolIdx} (${updatedSchools[schoolIdx].school.name}):`, {
        before: currentPackages,
        after: newPackages
      });
      
      updatedSchools[schoolIdx] = {
        ...updatedSchools[schoolIdx],
        packages: newPackages
      };
      
      const result = {
        ...prevFormData,
        contributions: {
          ...prevFormData.contributions,
          [programIdx]: { ...prevContribution, schools: updatedSchools }
        }
      };
      
      console.log(`[handleInfrastructurePackageChange] After update, all schools:`, 
        result.contributions[programIdx].schools.map((s: any, i: number) => ({
          idx: i,
          name: s.school.name,
          packages: s.packages
        }))
      );
      
      return result;
    });
  };

  return (
    <div className="min-h-screen bg-surface-subdued">
      <div className="w-full bg-surface-default border-b border-border-light shadow-elevation-sm">
        <div className="max-w-3xl mx-auto p-spacing-4">
          {/* Header with Back Button */}
          <div className="flex items-center gap-spacing-4">
            <button
              onClick={() => {
                onClose();
                setCurrentStep(1);
              }}
              className="flex items-center gap-spacing-2 text-default transition-colors hover:opacity-80"
              aria-label="Kembali"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="h-6 w-px bg-[var(--border-light)]" />
            <h3 className="text-display-small text-default">
              Form Kontribusi
            </h3>
          </div>
        </div>
      </div>
      
      {/* Progress Steps Container - Full Width */}
      <div className="w-full bg-default">
        <div className="max-w-3xl mx-auto pt-10 px-spacing-4 pb-[120px]">
          <div className="flex items-center justify-between relative">
              {/* Step 1 */}
              <div className="flex flex-col items-center z-10 flex-[0_1_auto] min-w-[80px]">
                <div 
                  className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 ${
                    currentStep >= 1 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-surface-neutral-default text-subdued border border-border-light'
                  }`}
                  style={{ 
                    fontSize: 'var(--body-size)',
                    fontWeight: 'var(--font-weight-semibold)',
                  }}
                >
                  1
                </div>
                <span 
                  className={`text-center mt-spacing-2 text-helper ${
                    currentStep >= 1 ? 'text-default' : 'text-subdued'
                  }`}
                >
                  Pilih Program
                </span>
              </div>

              {/* Line 1-2 */}
              <div 
                className={`flex-1 h-0.5 mx-spacing-2 transition-all duration-200 ${
                  currentStep >= 2 ? 'bg-primary' : 'bg-[var(--border-light)]'
                }`}
              />

              {/* Step 2 */}
              <div className="flex flex-col items-center z-10 flex-[0_1_auto] min-w-[80px]">
                <div 
                  className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 ${
                    currentStep >= 2 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-surface-neutral-default text-subdued border border-border-light'
                  }`}
                  style={{ 
                    fontSize: 'var(--body-size)',
                    fontWeight: 'var(--font-weight-semibold)',
                  }}
                >
                  2
                </div>
                <span 
                  className={`text-center mt-spacing-2 text-helper ${
                    currentStep >= 2 ? 'text-default' : 'text-subdued'
                  }`}
                >
                  Detail Kontribusi
                </span>
              </div>

              {/* Line 2-3 */}
              <div 
                className={`flex-1 h-0.5 mx-spacing-2 transition-all duration-200 ${
                  currentStep >= 3 ? 'bg-primary' : 'bg-[var(--border-light)]'
                }`}
              />

              {/* Step 3 */}
              <div className="flex flex-col items-center z-10 flex-[0_1_auto] min-w-[80px]">
                <div 
                  className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 ${
                    currentStep >= 3 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-surface-neutral-default text-subdued border border-border-light'
                  }`}
                  style={{ 
                    fontSize: 'var(--body-size)',
                    fontWeight: 'var(--font-weight-semibold)',
                  }}
                >
                  3
                </div>
                <span 
                  className={`text-center mt-spacing-2 text-helper ${
                    currentStep >= 3 ? 'text-default' : 'text-subdued'
                  }`}
                >
                  Data Diri
                </span>
              </div>

              {/* Line 3-4 */}
              <div 
                className={`flex-1 h-0.5 mx-spacing-2 transition-all duration-200 ${
                  currentStep >= 4 ? 'bg-primary' : 'bg-[var(--border-light)]'
                }`}
              />

              {/* Step 4 */}
              <div className="flex flex-col items-center z-10 flex-[0_1_auto] min-w-[80px]">
                <div 
                  className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 ${
                    currentStep >= 4 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-surface-neutral-default text-subdued border border-border-light'
                  }`}
                  style={{ 
                    fontSize: 'var(--body-size)',
                    fontWeight: 'var(--font-weight-semibold)',
                  }}
                >
                  4
                </div>
                <span 
                  className={`text-center mt-spacing-2 text-helper ${
                    currentStep >= 4 ? 'text-default' : 'text-subdued'
                  }`}
                >
                  Review
                </span>
              </div>
          </div>
        </div>
      </div>

      {/* Form Content Container */}
      <div className="max-w-3xl mx-auto px-spacing-4 -mt-20">
        <div className="overflow-hidden bg-card rounded-card shadow-elevation-sm relative z-10">
          {/* Step 1: Pilih Program */}
          {currentStep === 1 && (
            <div className="flex flex-col w-full">
              <div className="flex flex-col items-start justify-center w-full bg-accent gap-spacing-2 p-spacing-6">
                <h4 className="text-heading-medium text-accent-foreground">
                  Pilih Program Kontribusi
                </h4>
              </div>
              
              <div className="p-spacing-6 bg-surface-default">
                {/* Information Banner */}
                <div className="flex items-center gap-spacing-3 bg-surface-informational-default border border-border-light rounded p-spacing-4 mb-spacing-4">
                  <div className="flex-shrink-0 w-5 h-5 text-icon-informational">
                    <svg 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
                      <path d="M9 18h6" />
                      <path d="M10 22h4" />
                    </svg>
                  </div>
                  <div className="text-body-small text-informational">
                    Anda bisa berkontribusi lebih dari satu program
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-spacing-4">
                  {cardDetails.map((card, index) => {
                    const isSelected = selectedProgram.includes(index);
                    const isHovered = hoveredCardIndex === index;
                    
                    return (
                      <div 
                        key={index}
                        className={`overflow-hidden relative group cursor-pointer rounded-card flex flex-col gap-spacing-3 p-spacing-5 transition-colors border ${
                          isSelected
                            ? 'border-primary bg-[var(--primary-50)]'
                            : isHovered
                            ? 'border-border-light bg-surface-subdued'
                            : 'border-border-light bg-surface-default'
                        }`}
                        onMouseEnter={() => setHoveredCardIndex(index)}
                        onMouseLeave={() => setHoveredCardIndex(null)}
                        onClick={() => {
                          if (isSelected) {
                            // Remove from selection
                            setSelectedProgram(selectedProgram.filter(i => i !== index));
                          } else {
                            // Add to selection
                            setSelectedProgram([...selectedProgram, index]);
                          }
                        }}
                      >
                        {/* Title dengan Icon */}
                        <div className="flex items-center gap-spacing-3">
                          <div className="relative flex items-center justify-center shrink-0 w-11 h-11 transition-all">
                            <ProgramIllustration title={card.title} />
                          </div>
                          
                          <div 
                            className="font-semibold flex-1 text-foreground"
                            style={{ 
                              fontSize: 'var(--text-lg)',
                              lineHeight: 'var(--heading-medium-height)',
                            }}
                          >
                            {card.title}
                          </div>
                          
                          {/* Checkmark Badge - sejajar dengan title */}
                          {isSelected && (
                            <div className="shrink-0 shadow-sm bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center">
                              <svg 
                                className="w-4 h-4"
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                                strokeWidth={3}
                              >
                                <path 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round" 
                                  d="M5 13l4 4L19 7" 
                                />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Deskripsi Full Width */}
                        <div className="text-body-small text-subdued">
                          {card.description}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Data Diri */}
          {currentStep === 3 && (
            <div className="flex flex-col w-full">
              <div className="flex flex-col items-start justify-center w-full bg-accent gap-spacing-2 p-spacing-6">
                <h4 className="text-heading-medium text-accent-foreground">
                  Rincian Kontributor
                </h4>
              </div>
              
              <div className="flex flex-col gap-spacing-6 p-spacing-6 bg-surface-default">
                {/* Segmen 1: Informasi Perusahaan */}
                <div className="border border-border-light rounded-lg overflow-hidden">
                  <div className="bg-surface-subdued px-5 py-4 border-b border-border-light">
                    <h5 className="font-semibold text-foreground" style={{ fontSize: 'var(--text-base)' }}>Informasi Perusahaan</h5>
                  </div>
                  <div className="p-5 flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormInput
                        label="Nama Perusahaan"
                        value={formData.organization}
                        onChange={(value) => setFormData({ ...formData, organization: value })}
                        placeholder="Ketik nama perusahaan"
                      />
                      <Select
                        label="Bentuk Badan Hukum"
                        placeholder="Pilih bentuk badan hukum"
                        value={formData.badanHukum || ''}
                        onChange={(value) => setFormData({ ...formData, badanHukum: value })}
                        options={[
                          { label: 'PT', value: 'pt' },
                          { label: 'PT Perorangan', value: 'pt-perorangan' },
                          { label: 'Yayasan', value: 'yayasan' },
                          { label: 'Koperasi', value: 'koperasi' },
                          { label: 'Perkumpulan', value: 'perkumpulan' },
                          { label: 'BUMN/BUMD', value: 'bumn-bumd' }
                        ]}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-foreground" style={{ fontSize: 'var(--input-label-size)', fontWeight: 'var(--input-label-weight)', color: 'var(--input-label-color)' }}>
                        Status Mitra
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="statusMitra"
                            checked={formData.statusMitra === 'baru'}
                            onChange={() => setFormData({ ...formData, statusMitra: 'baru' })}
                            className="w-4 h-4 text-primary"
                          />
                          <span className="text-foreground" style={{ fontSize: 'var(--text-base)' }}>Baru</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="statusMitra"
                            checked={formData.statusMitra === 'lama'}
                            onChange={() => setFormData({ ...formData, statusMitra: 'lama' })}
                            className="w-4 h-4 text-primary"
                          />
                          <span className="text-foreground" style={{ fontSize: 'var(--text-base)' }}>Lama</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Segmen 2: Data Narahubung */}
                <div className="border border-border-light rounded-lg overflow-hidden">
                  <div className="bg-surface-subdued px-5 py-4 border-b border-border-light">
                    <h5 className="font-semibold text-foreground" style={{ fontSize: 'var(--text-base)' }}>Data Narahubung</h5>
                  </div>
                  <div className="p-5 flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormInput
                        label="Nama"
                        value={formData.fullName}
                        onChange={(value) => setFormData({ ...formData, fullName: value })}
                        placeholder="Ketik nama lengkap"
                      />
                      <FormInput
                        label="Jabatan dan Posisi"
                        value={formData.position}
                        onChange={(value) => setFormData({ ...formData, position: value })}
                        placeholder="Ketik jabatan dan posisi"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormInput
                        label="Email Kantor"
                        value={formData.email}
                        onChange={(value) => setFormData({ ...formData, email: value })}
                        placeholder="Ketik email kantor"
                        type="email"
                      />
                      <FormInput
                        label="Nomor Telepon"
                        value={formData.phone}
                        onChange={(value) => {
                          const numericValue = value.replace(/[^0-9]/g, '');
                          setFormData({ ...formData, phone: numericValue });
                        }}
                        placeholder="Ketik nomor telepon"
                        type="tel"
                      />
                    </div>
                  </div>
                </div>

                {/* Segmen 3: Dokumen Pendukung */}
                <div className="border border-border-light rounded-lg overflow-hidden">
                  <div className="bg-surface-subdued px-5 py-4 border-b border-border-light">
                    <h5 className="font-semibold text-foreground" style={{ fontSize: 'var(--text-base)' }}>Dokumen Pendukung</h5>
                  </div>
                  <div className="p-5">
                    <FileUpload
                      label="Company Profile"
                      value={formData.companyProfile}
                      onChange={(file) => setFormData({ ...formData, companyProfile: file })}
                      placeholder="Pilih berkas company profile"
                      accept=".pdf,.doc,.docx"
                      helperText="Format berkas yang didukung: PDF, DOC, DOCX. Maksimum ukuran berkas 10 MB"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Detail Kontribusi */}
          {currentStep === 2 && (
            <div className="flex flex-col w-full">
              <div className="flex flex-col items-start justify-center w-full bg-accent gap-spacing-2 p-spacing-6">
                <h4 className="text-heading-medium text-accent-foreground">
                  Detail Kontribusi
                </h4>
              </div>

              <div className="flex flex-col gap-spacing-6 p-spacing-6 bg-surface-default">
                {selectedProgram.map((programIndex, idx) => {
                  const program = cardDetails[programIndex];
                  const contribution = formData.contributions[idx] || { 
                    type: '', 
                    amount: '', 
                    notes: '',
                    school: '',
                    schools: [],
                    packages: []
                  };
                  const isInfrastrukturDigital = program.title === "Infrastruktur Digital";
                  const isRevitalisasiSekolah = program.title === "Revitalisasi Sekolah";
                  const isExpanded = expandedPrograms.includes(idx);
                  // Both Infrastruktur Digital and Revitalisasi Sekolah use multi-school flow
                  const isMultiSchoolProgram = isRevitalisasiSekolah || isInfrastrukturDigital;

                  // Debug logging
                  console.log(`Program ${idx} (${program.title}):`, {
                    isRevitalisasiSekolah,
                    isInfrastrukturDigital,
                    isMultiSchoolProgram,
                    schools: contribution.schools,
                    schoolsLength: contribution.schools?.length
                  });

                  return (
                    <div key={idx} className="border border-border-light rounded-lg overflow-hidden">
                      <div className="bg-default flex items-start gap-4 p-4 w-full hover:bg-surface-subdued transition-colors">
                        <div className="w-11 h-11 rounded-lg shrink-0">
                          <ProgramIllustration title={program.title} />
                        </div>
                        <button
                          onClick={() => {
                            setExpandedPrograms(prev =>
                              prev.includes(idx)
                                ? prev.filter(p => p !== idx)
                                : [...prev, idx]
                            );
                          }}
                          className="flex-1 text-left"
                        >
                          <p
                            className="text-subdued mb-0.5"
                            style={{ fontSize: '14px' }}
                          >
                            Program {idx + 1}
                          </p>
                          <h4
                            className="font-semibold text-default"
                            style={{ fontSize: 'var(--text-lg)' }}
                          >
                            {program.title}
                          </h4>
                        </button>
                        <div className="flex items-center gap-2 shrink-0 self-center">
                          <button
                            onClick={() => {
                              setExpandedPrograms(prev =>
                                prev.includes(idx)
                                  ? prev.filter(p => p !== idx)
                                  : [...prev, idx]
                              );
                            }}
                            className="p-1 hover:bg-muted-foreground/10 rounded transition-colors"
                            aria-label={isExpanded ? "Tutup detail" : "Buka detail"}
                          >
                            <ChevronDown 
                              className={`w-6 h-6 text-icon-default transition-transform ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                          <SimpleDropdownMenu
                            align="end"
                            trigger={
                              <button
                                type="button"
                                className="p-1 hover:bg-muted-foreground/10 rounded transition-colors"
                                aria-label="Opsi lainnya"
                              >
                                <MoreVertical className="w-6 h-6 text-icon-default" />
                              </button>
                            }
                          >
                            <SimpleDropdownMenuItem
                              icon={Trash2}
                              label="Hapus Program Kontribusi"
                              iconSize={24}
                              variant="destructive"
                              onClick={() => {
                                const updatedPrograms = selectedProgram.filter((_, i) => i !== idx);
                                setSelectedProgram(updatedPrograms);
                                const newContributions = { ...formData.contributions };
                                delete newContributions[idx];
                                setFormData({ ...formData, contributions: newContributions });
                              }}
                            />
                          </SimpleDropdownMenu>
                        </div>
                      </div>

                      {/* Form Detail - Collapsible */}
                      {isExpanded && (
                        <div className="p-6 bg-background border-t border-border-light">
                          <div className="flex flex-col gap-5">
                            {/* Multi-School Programs: Revitalisasi Sekolah & Infrastruktur Digital */}
                            {isMultiSchoolProgram ? (
                              <div className="flex flex-col gap-4">
                                <label 
                                  className="text-foreground"
                                  style={{
                                    fontSize: 'var(--input-label-size)',
                                    fontWeight: 'var(--input-label-weight)',
                                    color: 'var(--input-label-color)',
                                    lineHeight: '22px',
                                    display: 'block'
                                  }}
                                >
                                  Satuan Pendidikan
                                </label>

                                {/* List of selected schools */}
                                {formData.contributions[idx]?.schools && formData.contributions[idx].schools.length > 0 && (
                                  <div className="flex flex-col gap-4">
                                    {formData.contributions[idx].schools.map((schoolItem: any, schoolIdx: number) => {
                                      return (
                                      <div key={`${idx}-${schoolItem.school.npsn}-${schoolIdx}`} className="border border-border-light rounded-lg overflow-hidden">
                                        {/* School Info Header */}
                                        <div className="p-4 bg-default">
                                          <div className="w-full flex items-center justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                              <p className="text-action text-default mb-1">{schoolItem.school.name}</p>
                                              <p className="text-body-small text-muted-foreground">{schoolItem.school.students} Murid • {schoolItem.school.location}</p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                              <button
                                                onClick={() => {
                                                  const schoolKey = `${idx}-${schoolIdx}`;
                                                  setExpandedSchools(prev => ({
                                                    ...prev,
                                                    [schoolKey]: !prev[schoolKey]
                                                  }));
                                                }}
                                                className="p-1 hover:bg-muted-foreground/10 rounded transition-colors"
                                                aria-label={expandedSchools[`${idx}-${schoolIdx}`] ? "Tutup detail" : "Buka detail"}
                                              >
                                                <ChevronDown 
                                                  className={`w-5 h-5 text-icon-default transition-transform ${
                                                    expandedSchools[`${idx}-${schoolIdx}`] ? 'rotate-180' : ''
                                                  }`}
                                                />
                                              </button>
                                              <SimpleDropdownMenu
                                                align="end"
                                                trigger={
                                                  <button
                                                    type="button"
                                                    className="p-1 hover:bg-muted-foreground/10 rounded transition-colors"
                                                    aria-label="Opsi lainnya"
                                                  >
                                                    <MoreVertical className="w-5 h-5 text-icon-default" />
                                                  </button>
                                                }
                                              >
                                                <SimpleDropdownMenuItem
                                                  icon={School}
                                                  label="Ubah atau ganti satuan pendidikan"
                                                  iconSize={24}
                                                  onClick={() => onOpenSchoolMap(idx, schoolIdx)}
                                                />
                                                {formData.contributions[idx]?.schools?.length > 1 && (
                                                  <SimpleDropdownMenuItem
                                                    icon={Trash2}
                                                    label="Hapus satuan pendidikan ini"
                                                    iconSize={24}
                                                    variant="destructive"
                                                    onClick={() => {
                                                      const updatedSchools = formData.contributions[idx].schools.filter((_: any, sIdx: number) => sIdx !== schoolIdx);
                                                      setFormData({
                                                        ...formData,
                                                        contributions: {
                                                          ...formData.contributions,
                                                          [idx]: { ...contribution, schools: updatedSchools }
                                                        }
                                                      });
                                                      
                                                      // Cleanup expanded state for deleted school and re-index remaining schools
                                                      const newExpandedSchools = { ...expandedSchools };
                                                      delete newExpandedSchools[`${idx}-${schoolIdx}`];
                                                      
                                                      // Re-index schools after deletion
                                                      const reindexed: Record<string, boolean> = {};
                                                      Object.keys(newExpandedSchools).forEach(key => {
                                                        const [progIdx, schIdx] = key.split('-').map(Number);
                                                        if (progIdx === idx && schIdx > schoolIdx) {
                                                          reindexed[`${progIdx}-${schIdx - 1}`] = newExpandedSchools[key];
                                                        } else {
                                                          reindexed[key] = newExpandedSchools[key];
                                                        }
                                                      });
                                                      setExpandedSchools(reindexed);
                                                    }}
                                                  />
                                                )}
                                              </SimpleDropdownMenu>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Package/Building Selection for this school - Collapsible */}
                                        {expandedSchools[`${idx}-${schoolIdx}`] && (
                                        <div className="p-4 bg-background border-t border-border-light">
                                          <div className="flex flex-col gap-3">
                                            {/* Revitalisasi Sekolah - Building Selection */}
                                            {isRevitalisasiSekolah && (
                                              <>
                                                <label 
                                                  className="text-foreground"
                                                  style={{
                                                    fontSize: 'var(--input-label-size)',
                                                    fontWeight: 'var(--input-label-weight)',
                                                    color: 'var(--input-label-color)',
                                                    lineHeight: '22px',
                                                    display: 'block'
                                                  }}
                                                >
                                                  Pilih Bangunan yang Akan Direvitalisasi
                                                </label>
                                                <div className="flex flex-col gap-3">
                                                  {revitalizationBuildings.map((building) => {
                                                    // Get current state for this specific school by NPSN from formData directly
                                                    const currentSchoolState = formData.contributions[idx]?.schools?.find((s: any) => s.school.npsn === schoolItem.school.npsn);
                                                    const isSelected = currentSchoolState?.selectedBuildings?.includes(building.id) || false;
                                                    
                                                    return (
                                                      <RevitalizationBuildingCard
                                                        key={building.id}
                                                        building={building}
                                                        icon={svgPathsRevitalisasi}
                                                        isSelected={isSelected}
                                                        onToggle={(buildingId, checked) => {
                                                        const targetNPSN = schoolItem.school.npsn;
                                                        setFormData((prevFormData) => {
                                                          const prevContribution = prevFormData.contributions[idx];
                                                          const updatedSchools = [...prevContribution.schools];
                                                          
                                                          // Find the correct school index by NPSN
                                                          const targetSchoolIdx = updatedSchools.findIndex(s => s.school.npsn === targetNPSN);
                                                          if (targetSchoolIdx === -1) return prevFormData;
                                                          
                                                          const currentBuildings = updatedSchools[targetSchoolIdx].selectedBuildings || [];
                                                          const newBuildings = checked
                                                            ? [...currentBuildings, buildingId]
                                                            : currentBuildings.filter((id: string) => id !== buildingId);
                                                          
                                                          updatedSchools[targetSchoolIdx] = {
                                                            ...updatedSchools[targetSchoolIdx],
                                                            selectedBuildings: newBuildings
                                                          };
                                                          
                                                          return {
                                                            ...prevFormData,
                                                            contributions: {
                                                              ...prevFormData.contributions,
                                                              [idx]: { ...prevContribution, schools: updatedSchools }
                                                            }
                                                          };
                                                        });
                                                      }}
                                                    />
                                                    );
                                                  })}
                                                </div>
                                              </>
                                            )}

                                            {/* Infrastruktur Digital - Package Selection */}
                                            {isInfrastrukturDigital && (
                                              <>
                                                <label 
                                                  className="text-foreground"
                                                  style={{
                                                    fontSize: 'var(--input-label-size)',
                                                    fontWeight: 'var(--input-label-weight)',
                                                    color: 'var(--input-label-color)',
                                                    lineHeight: '22px',
                                                    display: 'block'
                                                  }}
                                                >
                                                  Pilih Paket Infrastruktur
                                                </label>
                                                <InfrastructurePackageSelector
                                                  programIdx={idx}
                                                  schoolIdx={schoolIdx}
                                                  selectedPackages={formData.contributions[idx]?.schools?.[schoolIdx]?.packages || []}
                                                  onPackageChange={handleInfrastructurePackageChange}
                                                />
                                              </>
                                            )}

                                            {/* Notes for this school */}
                                            <div className="flex flex-col gap-2 mt-2">
                                              <label 
                                                className="text-foreground"
                                                style={{
                                                  fontSize: 'var(--input-label-size)',
                                                  fontWeight: 'var(--input-label-weight)',
                                                  color: 'var(--input-label-color)',
                                                  lineHeight: '22px',
                                                  display: 'block'
                                                }}
                                              >
                                                Catatan untuk Satuan Pendidikan Ini (Opsional)
                                              </label>
                                              <textarea
                                                value={schoolItem.notes || ''}
                                                onChange={(e) => {
                                                  const targetNPSN = schoolItem.school.npsn;
                                                  const newNotes = e.target.value;
                                                  setFormData((prevFormData) => {
                                                    const prevContribution = prevFormData.contributions[idx];
                                                    const updatedSchools = [...prevContribution.schools];
                                                    
                                                    // Find the correct school index by NPSN
                                                    const targetSchoolIdx = updatedSchools.findIndex(s => s.school.npsn === targetNPSN);
                                                    if (targetSchoolIdx === -1) return prevFormData;
                                                    
                                                    updatedSchools[targetSchoolIdx] = {
                                                      ...updatedSchools[targetSchoolIdx],
                                                      notes: newNotes
                                                    };
                                                    
                                                    return {
                                                      ...prevFormData,
                                                      contributions: {
                                                        ...prevFormData.contributions,
                                                        [idx]: { ...prevContribution, schools: updatedSchools }
                                                      }
                                                    };
                                                  });
                                                }}
                                                placeholder="Tambahkan informasi lain yang relevan untuk satuan pendidikan ini"
                                                className="w-full px-4 py-3 border border-border-light rounded bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                                                rows={3}
                                              />
                                            </div>
                                          </div>
                                        </div>
                                        )}
                                      </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* Add School Button */}
                                <button
                                  onClick={() => onOpenSchoolMap(idx)}
                                  className={`w-full flex items-center ${
                                    formData.contributions[idx]?.schools && formData.contributions[idx].schools.length > 0
                                      ? 'justify-center gap-2 p-3 bg-[var(--surface-default)] text-[var(--text-default)] border-2 border-dashed border-[var(--border-default)] rounded-lg hover:bg-[var(--surface-subdued)] active:bg-[var(--surface-pressed)] transition-all group'
                                      : 'justify-between gap-2 p-3 bg-[var(--surface-default)] text-[var(--text-default)] border border-[var(--border-default)] rounded-lg hover:bg-[var(--surface-subdued)] active:bg-[var(--surface-pressed)] transition-all group'
                                  }`}
                                >
                                  {formData.contributions[idx]?.schools && formData.contributions[idx].schools.length > 0 ? (
                                    <>
                                      <Plus className="w-5 h-5 text-muted-foreground" />
                                      <span 
                                        className="text-default"
                                        style={{
                                          fontSize: 'var(--action-size)',
                                          fontWeight: 'var(--action-weight)',
                                          lineHeight: 'var(--action-height)'
                                        }}
                                      >
                                        Tambahkan satuan pendidikan lain
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <span 
                                        className="text-default"
                                        style={{
                                          fontSize: 'var(--action-size)',
                                          fontWeight: 'var(--action-weight)',
                                          lineHeight: 'var(--action-height)'
                                        }}
                                      >
                                        Pilih satuan pendidikan dari peta
                                      </span>
                                      <ArrowRight className="w-4 h-4 text-icon-default" />
                                    </>
                                  )}
                                </button>
                              </div>
                            ) : null}

                            {/* Content for other programs - Dropdown + Prerequisites + Textarea */}
                            {!isMultiSchoolProgram && (() => {
                              const programContent = getProgramContent(program.title);
                              
                              if (!programContent) {
                                // Fallback to old form if no content config
                                return (
                                  <>
                                    <FormInput
                                      label="Jenis Kontribusi"
                                      value={contribution.type || ''}
                                      onChange={(value) => {
                                        setFormData({
                                          ...formData,
                                          contributions: {
                                            ...formData.contributions,
                                            [idx]: { ...contribution, type: value }
                                          }
                                        });
                                      }}
                                      placeholder="Contoh: Peralatan olahraga, buku bacaan, dll"
                                    />
                                  </>
                                );
                              }

// Special handling for Bahan Ajar Digital
                              if (program.title === "Bahan Ajar Digital") {
                                return (
                                  <div className="flex flex-col gap-3">
                                    {/* Target Audience Label */}
                                    <p
                                      className="text-foreground"
                                      style={{
                                        fontSize: 'var(--input-label-size)',
                                        fontWeight: 'var(--input-label-weight)',
                                        color: 'var(--input-label-color)',
                                        lineHeight: '22px'
                                      }}
                                    >
                                      {programContent.targetAudienceLabel}
                                    </p>
                                   
                                    {/* Guru & Murid with nested jenjang & prasyarat */}
                                    {programContent.targetAudienceOptions.map((targetOption: any) => {
                                      const isTargetChecked = (contribution.targetAudience || []).includes(targetOption.value);
                                      const isGuru = targetOption.value === 'guru';
                                      
                                      return (
                                        <div key={targetOption.value} className={`rounded-lg overflow-hidden border transition-colors ${isTargetChecked ? 'border-primary' : 'border-border-light'}`}>
                                          {/* Target Audience Checkbox */}
                                          <label
                                            className={`flex items-center gap-3 p-4 cursor-pointer transition-colors ${
                                              isTargetChecked
                                                ? 'bg-[var(--primary-50)]'
                                                : 'bg-background hover:bg-surface-subdued'
                                            }`}
                                          >
                                            <div className="relative shrink-0">
                                              <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={isTargetChecked}
                                                onChange={(e) => {
                                                  const current = contribution.targetAudience || [];
                                                  const newValues = e.target.checked
                                                    ? [...current, targetOption.value]
                                                    : current.filter((t: string) => t !== targetOption.value);
                                                  setFormData({
                                                    ...formData,
                                                    contributions: {
                                                      ...formData.contributions,
                                                      [idx]: {
                                                        ...contribution,
                                                        targetAudience: newValues,
                                                        jenjangGuru: newValues.includes('guru') ? contribution.jenjangGuru : [],
                                                        jenjangMurid: newValues.includes('murid') ? contribution.jenjangMurid : []
                                                      }
                                                    }
                                                  });
                                                }}
                                              />
                                              <div
                                                className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${
                                                  isTargetChecked
                                                    ? 'bg-primary border-primary'
                                                    : 'bg-input-background border-border peer-hover:border-primary'
                                                }`}
                                              >
                                                {isTargetChecked && (
                                                  <svg className="w-3 h-3 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                  </svg>
                                                )}
                                              </div>
                                            </div>
                                            <span className="text-foreground font-medium" style={{ fontSize: '14px' }}>{targetOption.label}</span>
                                          </label>

                                          {/* Nested: Jenjang + Prasyarat (only show when checked) */}
                                          {isTargetChecked && (
                                            <div className="p-4 border-t border-border-light flex flex-col gap-3">
                                              {/* Jenjang - 4 columns grid */}
                                              <div>
                                                <div className="flex items-center justify-between mb-2">
                                                  <p
                                                    className="text-foreground"
                                                    style={{
                                                      fontSize: 'var(--input-label-size)',
                                                      fontWeight: 'var(--input-label-weight)',
                                                      color: 'var(--input-label-color)'
                                                    }}
                                                  >
                                                    Jenjang Pendidikan
                                                  </p>
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      const allJenjangValues = programContent.jenjangOptions.map((j: any) => j.value);
                                                      setFormData({
                                                        ...formData,
                                                        contributions: {
                                                          ...formData.contributions,
                                                          [idx]: {
                                                            ...contribution,
                                                            [isGuru ? 'jenjangGuru' : 'jenjangMurid']: allJenjangValues
                                                          }
                                                        }
                                                      });
                                                    }}
                                                    className="text-sm text-primary hover:opacity-80 transition-opacity font-medium"
                                                  >
                                                    Pilih Semua
                                                  </button>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2">
                                                  {programContent.jenjangOptions.map((jenjangOption: any) => {
                                                    const selectedJenjang = isGuru ? (contribution.jenjangGuru || []) : (contribution.jenjangMurid || []);
                                                    const isChecked = selectedJenjang.includes(jenjangOption.value);

                                                    return (
                                                      <label
                                                        key={jenjangOption.value}
                                                        className={`flex items-center gap-3 p-3 cursor-pointer transition-colors rounded border ${
                                                          isChecked
                                                            ? 'border-primary bg-[var(--primary-50)]'
                                                            : 'border-border-light bg-background hover:bg-surface-subdued'
                                                        }`}
                                                      >
                                                        <div className="relative shrink-0">
                                                          <input
                                                            type="checkbox"
                                                            className="sr-only peer"
                                                            checked={isChecked}
                                                            onChange={(e) => {
                                                              const current = isGuru ? (contribution.jenjangGuru || []) : (contribution.jenjangMurid || []);
                                                              const newValues = e.target.checked
                                                                ? [...current, jenjangOption.value]
                                                                : current.filter((t: string) => t !== jenjangOption.value);
                                                              setFormData({
                                                                ...formData,
                                                                contributions: {
                                                                  ...formData.contributions,
                                                                  [idx]: {
                                                                    ...contribution,
                                                                    [isGuru ? 'jenjangGuru' : 'jenjangMurid']: newValues
                                                                  }
                                                                }
                                                              });
                                                            }}
                                                          />
                                                          <div
                                                            className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${
                                                              isChecked
                                                                ? 'bg-primary border-primary'
                                                                : 'bg-input-background border-border peer-hover:border-primary'
                                                            }`}
                                                          >
                                                            {isChecked && (
                                                              <svg className="w-3 h-3 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                              </svg>
                                                            )}
                                                          </div>
                                                        </div>
                                                        <span className="text-foreground font-medium" style={{ fontSize: '14px' }}>{jenjangOption.label}</span>
                                                      </label>
                                                    );
                                                  })}
                                                </div>
                                              </div>

                                              {/* Prasyarat - Show when jenjang is selected */}
                                              {((isGuru && (contribution.jenjangGuru || []).length > 0) || (!isGuru && (contribution.jenjangMurid || []).length > 0)) && (
                                                <div className="mt-4">
                                                  <button
                                                    type="button"
                                                    onClick={() => setExpandedPrasyarat(prev => ({...prev, [targetOption.value]: !prev[targetOption.value]}))}
                                                    className="w-full flex items-center justify-between py-1 hover:opacity-80 transition-opacity"
                                                  >
                                                    <span className="text-foreground font-medium" style={{ fontSize: 'var(--text-base)' }}>
                                                      Prasyarat untuk {targetOption.label}
                                                    </span>
                                                    <svg
                                                      className={`w-4 h-4 text-foreground transition-transform ${expandedPrasyarat[targetOption.value] ? 'rotate-180' : ''}`}
                                                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                                    >
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                  </button>
                                                  {expandedPrasyarat[targetOption.value] && (
                                                    <div className="mt-2 border-t border-border-light pt-3">
                                                      <ContributionPrerequisites
                                                        prasyaratSubstansi={isGuru ? programContent.prasyaratGuru.prasyaratSubstansi : programContent.prasyaratMurid.prasyaratSubstansi}
                                                        prasyaratTeknis={isGuru ? programContent.prasyaratGuru.prasyaratTeknis : programContent.prasyaratMurid.prasyaratTeknis}
                                                      />
                                                    </div>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
</div>
                                );
                              }

                              // Special handling for Pengembangan Platform Digital - no "Lainnya", show prasyarat per option
                              if (program.title === "Pengembangan Platform Digital") {
                                return (
                                  <div className="flex flex-col gap-3">
                                    <p
                                      className="text-foreground"
                                      style={{
                                        fontSize: 'var(--input-label-size)',
                                        fontWeight: 'var(--input-label-weight)',
                                        color: 'var(--input-label-color)'
                                      }}
                                    >
                                      {programContent.fieldLabel}
                                    </p>

                                    {programContent.options.map((option: any) => {
                                      const isChecked = (contribution.selectedTopics || []).includes(option.value);
                                      return (
                                        <div key={option.value} className={`rounded-lg overflow-hidden border transition-colors ${isChecked ? 'border-primary' : 'border-border-light'}`}>
                                          <label
                                            className={`flex items-center gap-3 p-4 cursor-pointer transition-colors ${
                                              isChecked
                                                ? 'bg-[var(--primary-50)]'
                                                : 'bg-background hover:bg-surface-subdued'
                                            }`}
                                          >
                                            <div className="relative shrink-0">
                                              <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={isChecked}
                                                onChange={(e) => {
                                                  const currentTopics = contribution.selectedTopics || [];
                                                  const newTopics = e.target.checked
                                                    ? [...currentTopics, option.value]
                                                    : currentTopics.filter((t: string) => t !== option.value);
                                                  setFormData({
                                                    ...formData,
                                                    contributions: {
                                                      ...formData.contributions,
                                                      [idx]: { ...contribution, selectedTopics: newTopics }
                                                    }
                                                  });
                                                }}
                                              />
                                              <div
                                                className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${
                                                  isChecked
                                                    ? 'bg-primary border-primary'
                                                    : 'bg-input-background border-border peer-hover:border-primary'
                                                }`}
                                              >
                                                {isChecked && (
                                                  <svg className="w-3 h-3 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                  </svg>
)}
                                                </div>
                                              </div>
                                              <span className="text-foreground font-medium" style={{ fontSize: '14px' }}>{option.label}</span>
                                            </label>

                                          {/* Show prasyarat when checked - collapsible */}
                                          {isChecked && (option.prasyaratSubstansi || option.prasyaratTeknis) && (
                                            <div className="px-4 pb-4 pt-3 border-t border-border-light-light">
                                              <button
                                                type="button"
                                                onClick={() => setExpandedPrasyarat(prev => ({...prev, [option.value]: !prev[option.value]}))}
                                                className="flex items-center justify-between w-full"
                                              >
                                                <p className="font-medium text-foreground" style={{ fontSize: 'var(--text-base)' }}>
                                                  Prasyarat
                                                </p>
                                                <ChevronDown 
                                                  className={`w-4 h-4 text-foreground transition-transform ${expandedPrasyarat[option.value] ? 'rotate-180' : ''}`}
                                                />
                                              </button>
                                              {expandedPrasyarat[option.value] && (
                                                <div className="border-t border-border-light mt-2 pt-2">
                                                  <ContributionPrerequisites
                                                    prasyaratSubstansi={option.prasyaratSubstansi}
                                                    prasyaratTeknis={option.prasyaratTeknis}
                                                  />
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              }

return (
                                 <div className="flex flex-col gap-4">
                                   {/* Checkbox Group Selection */}
                                   <div className="flex flex-col gap-3">
                                     <label 
                                       className="text-foreground"
                                       style={{
                                         fontSize: 'var(--input-label-size)',
                                         fontWeight: 'var(--input-label-weight)',
                                         color: 'var(--input-label-color)',
                                         lineHeight: '22px',
                                         display: 'block'
                                       }}
                                     >
                                       {programContent.fieldLabel}
                                     </label>
                                     
{/* Program Options as Checkboxes - skip "lainnya" as it's handled separately */}
                                     {programContent.options.filter((opt: any) => opt.value !== 'lainnya').map((option: any) => {
                                       const isChecked = (contribution.selectedTopics || []).includes(option.value);
                                       return (
                                         <div key={option.value} className={`rounded-lg overflow-hidden border transition-colors ${isChecked ? 'border-primary' : 'border-border-light'}`}>
                                           <label
                                             className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                                               isChecked ? 'bg-[var(--primary-50)]' : 'bg-background hover:bg-surface-subdued'
                                             }`}
                                           >
                                             <div className="relative shrink-0">
                                               <input
                                                 type="checkbox"
                                                 className="sr-only peer"
                                                 checked={isChecked}
                                                 onChange={(e) => {
                                                   const currentTopics = contribution.selectedTopics || [];
                                                   const newTopics = e.target.checked
                                                     ? [...currentTopics, option.value]
                                                     : currentTopics.filter((t: string) => t !== option.value);
                                                   setFormData({
                                                     ...formData,
                                                     contributions: {
                                                       ...formData.contributions,
                                                       [idx]: { ...contribution, selectedTopics: newTopics }
                                                     }
                                                   });
                                                 }}
                                               />
                                               <div
                                                 className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${
                                                   isChecked
                                                     ? 'bg-primary border-primary'
                                                     : 'bg-input-background border-border peer-hover:border-primary'
                                                 }`}
                                               >
                                                 {isChecked && (
                                                   <svg className="w-3 h-3 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                   </svg>
                                                 )}
                                               </div>
</div>
                                              <span className="text-foreground font-medium" style={{ fontSize: '14px' }}>{option.label}</span>
                                            </label>
                                            {isChecked && option.deskripsi && (
                                              <div className="px-3 pb-3 bg-background border-t border-border-light">
                                                <p className="text-muted-foreground mt-2" style={{ fontSize: '14px' }}>{option.deskripsi}</p>
                                              </div>
                                            )}
                                          {/* Show prasyarat only for Pengembangan Platform Digital (per-option) */}
                                          {isChecked && (program.title === "Pengembangan Platform Digital") && (option.prasyaratSubstansi || option.prasyaratTeknis) && (
                                            <div className="px-4 pb-4 pt-3 border-t border-border-light-light">
                                              <button
                                                type="button"
                                                onClick={() => setExpandedPrasyarat(prev => ({...prev, [option.value]: !prev[option.value]}))}
                                                className="flex items-center justify-between w-full"
                                              >
                                                <p className="font-medium text-foreground" style={{ fontSize: 'var(--text-base)' }}>
                                                  Prasyarat
                                                </p>
                                                <ChevronDown 
                                                  className={`w-4 h-4 text-foreground transition-transform ${expandedPrasyarat[option.value] ? 'rotate-180' : ''}`}
                                                />
                                              </button>
                                              {expandedPrasyarat[option.value] && (
                                                <div className="border-t border-border-light mt-2 pt-2">
                                                  <ContributionPrerequisites
                                                    prasyaratSubstansi={option.prasyaratSubstansi}
                                                    prasyaratTeknis={option.prasyaratTeknis}
                                                  />
                                                </div>
                                              )}
                                            </div>
                                          )}
                                         </div>
                                       );
                                     })}
                                    
                                    {/* Lainnya Option - with free text input */}
                                    {(() => {
                                      const isLainnyaChecked = (contribution.selectedTopics || []).includes('lainnya') || !!contribution.otherTopic;
                                      return (
                                        <div className={`rounded-lg overflow-hidden border transition-colors ${isLainnyaChecked ? 'border-primary' : 'border-border-light'}`}>
                                          <label
                                            className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                                              isLainnyaChecked ? 'bg-[var(--primary-50)]' : 'bg-background hover:bg-surface-subdued'
                                            }`}
                                          >
                                            <div className="relative shrink-0">
                                              <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={isLainnyaChecked}
                                                onChange={(e) => {
                                                  const currentTopics = contribution.selectedTopics || [];
                                                  if (e.target.checked) {
                                                    setFormData({
                                                      ...formData,
                                                      contributions: {
                                                        ...formData.contributions,
                                                        [idx]: {
                                                          ...contribution,
                                                          selectedTopics: [...currentTopics, 'lainnya'],
                                                          otherTopic: ' '
                                                        }
                                                      }
                                                    });
                                                  } else {
                                                    setFormData({
                                                      ...formData,
                                                      contributions: {
                                                        ...formData.contributions,
                                                        [idx]: {
                                                          ...contribution,
                                                          selectedTopics: currentTopics.filter((t: string) => t !== 'lainnya'),
                                                          otherTopic: ''
                                                        }
                                                      }
                                                    });
                                                  }
                                                }}
                                              />
                                              <div
                                                className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${
                                                  isLainnyaChecked
                                                    ? 'bg-primary border-primary'
                                                    : 'bg-input-background border-border peer-hover:border-primary'
                                                }`}
                                              >
                                                {isLainnyaChecked && (
                                                  <svg className="w-3 h-3 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                  </svg>
                                                )}
                                              </div>
                                            </div>
                                            <span className="text-foreground font-medium" style={{ fontSize: '14px' }}>Lainnya</span>
                                          </label>
                                          {isLainnyaChecked && (
                                            <div className="px-3 pb-3 bg-background border-t border-border-light">
                                              <input
                                                type="text"
                                                className="w-full mt-2 px-3 py-2 border border-border-light rounded bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                                style={{ fontSize: '14px' }}
                                                placeholder="Tulis dukungan lainnya..."
                                                value={contribution.otherTopic === ' ' ? '' : contribution.otherTopic || ''}
                                                onChange={(e) => {
                                                  setFormData({
                                                    ...formData,
                                                    contributions: {
                                                      ...formData.contributions,
                                                      [idx]: { ...contribution, otherTopic: e.target.value }
                                                    }
                                                  });
                                                }}
                                              />
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </div>

                                  {/* Prerequisites - Show when at least one topic is selected (excluding Lainnya) - collapsible */}
                                  {contribution.selectedTopics && contribution.selectedTopics.length > 0 && (
                                    <div className="pt-3">
                                      <button
                                        type="button"
                                        onClick={() => setExpandedPrasyarat(prev => ({...prev, ['default']: !prev['default']}))}
                                        className="flex items-center justify-between w-full mb-2"
                                      >
                                        <p className="font-medium text-foreground" style={{ fontSize: 'var(--text-base)' }}>
                                          Prasyarat
                                        </p>
                                        <ChevronDown 
                                          className={`w-4 h-4 text-foreground transition-transform ${expandedPrasyarat['default'] ? 'rotate-180' : ''}`}
                                        />
                                      </button>
                                      <div className="border-t border-border-light pt-2">
                                        {expandedPrasyarat['default'] && (
                                          <div className="mt-2">
                                            <ContributionPrerequisites
                                              prasyaratSubstansi={programContent.options[0]?.prasyaratSubstansi}
                                              prasyaratTeknis={programContent.options[0]?.prasyaratTeknis}
                                            />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}

                            {/* Textarea with character counter - Show only for non-multi-school programs */}
                            {!isMultiSchoolProgram && (() => {
                              const programContent = getProgramContent(program.title);
                              const maxLength = 500;
                              const currentLength = contribution.notes?.length || 0;

                              return (
                                <div className="flex flex-col gap-2">
                                  <label 
                                    className="text-foreground"
                                    style={{
                                      fontSize: 'var(--input-label-size)',
                                      fontWeight: 'var(--input-label-weight)',
                                      color: 'var(--input-label-color)',
                                      lineHeight: '22px',
                                      display: 'block'
                                    }}
                                  >
                                    Informasi Tambahan (Opsional)
                                  </label>
                                  <textarea
                                    value={contribution.notes || ''}
                                    onChange={(e) => {
                                      const newValue = e.target.value;
                                      if (newValue.length <= maxLength) {
                                        setFormData({
                                          ...formData,
                                          contributions: {
                                            ...formData.contributions,
                                            [idx]: { ...contribution, notes: newValue }
                                          }
                                        });
                                      }
                                    }}
                                    placeholder={programContent ? "Sampaikan detail dukungan yang ingin Anda ajukan" : "Tambahkan informasi lain yang relevan"}
                                    className="w-full px-4 py-3 border border-border-light rounded bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                                    rows={4}
                                    maxLength={maxLength}
                                  />
                                  {programContent && (
                                    <div className="text-xs text-muted-foreground text-right">
                                      Jumlah karakter {currentLength}/{maxLength}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add More Program Button */}
                <button
                  onClick={onOpenProgramSelection}
                  className="flex items-center justify-center gap-2 transition-colors bg-foreground text-background hover:bg-foreground/90 active:bg-foreground/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:bg-border-light disabled:text-muted-foreground"
                  style={{ 
                    padding: 'var(--spacing-3) var(--spacing-5)',
                    borderRadius: 'var(--radius-button)',
                    fontWeight: 'var(--font-weight-semibold)'
                  }}
                >
                  <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-bold)' }}>+</span>
                  <span style={{ fontSize: 'var(--action-size)', fontWeight: 'var(--action-weight)', lineHeight: 'var(--action-height)' }}>
                    Tambah program lain
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="flex flex-col w-full">
              <div className="flex flex-col items-start justify-center w-full bg-accent gap-spacing-2 p-spacing-6">
                <h4 className="text-heading-medium text-accent-foreground">
                  Review Kontribusi
                </h4>
                <p className="text-body text-accent-foreground">
                  Pastikan semua informasi sudah benar sebelum mengirimkan
                </p>
              </div>

              <div className="flex flex-col gap-spacing-6 p-spacing-6 bg-surface-default">
                {/* Contributor Info Section - Simplified */}
                <div className="border border-border-light rounded-lg overflow-hidden">
                  <div className="bg-surface-subdued px-5 py-3 border-b border-border-light">
                    <h4 className="font-semibold text-foreground" style={{ fontSize: 'var(--text-base)' }}>Informasi Kontributor</h4>
                  </div>
<div className="p-5 flex flex-col gap-4">
                      {/* Informasi Perusahaan */}
                      <div className="flex flex-col gap-0">
                        <p className="text-subdued font-medium" style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', fontFamily: 'Inter' }}>Informasi Perusahaan</p>
                        <p className="text-foreground" style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'Inter' }}>{formData.organization || '-'}</p>
                        <p className="text-foreground" style={{ fontSize: 'var(--text-sm)', fontFamily: 'Inter' }}>
                          {formData.badanHukum === 'pt' ? 'PT' :
                           formData.badanHukum === 'pt-perorangan' ? 'PT Perorangan' :
                           formData.badanHukum === 'yayasan' ? 'Yayasan' :
                           formData.badanHukum === 'koperasi' ? 'Koperasi' :
                           formData.badanHukum === 'perkumpulan' ? 'Perkumpulan' :
                           formData.badanHukum === 'bumn-bumd' ? 'BUMN/BUMD' : ''}
                          {formData.statusMitra && ` • ${formData.statusMitra === 'baru' ? 'Baru' : formData.statusMitra === 'lama' ? 'Lama' : ''}`}
                        </p>
                        {formData.companyProfile && (
                          <div className="inline-flex items-center gap-2 px-3 py-2 border border-border-light rounded bg-white w-fit mt-1">
                            <File className="w-4 h-4 text-muted-foreground" />
                            <span className="text-foreground" style={{ fontSize: 'var(--text-sm)', fontFamily: 'Inter' }}>{formData.companyProfile.name}</span>
                          </div>
                        )}
                      </div>

                      {/* Narahubung */}
                      <div className="flex flex-col gap-0">
                        <p className="text-subdued font-medium" style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', fontFamily: 'Inter' }}>Narahubung</p>
                        <p className="text-foreground" style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'Inter' }}>{formData.fullName || '-'}</p>
                        <p className="text-foreground" style={{ fontSize: 'var(--text-sm)', fontFamily: 'Inter' }}>{formData.position || '-'}</p>
                        <p className="text-foreground" style={{ fontSize: 'var(--text-sm)', fontFamily: 'Inter' }}>
                          {formData.email || '-'}{formData.phone ? ` • ${formData.phone}` : ''}
                        </p>
                      </div>
                    </div>
                </div>

                {/* Contributions List */}
                <div className="border border-border-light rounded-lg overflow-hidden">
                  <div className="bg-surface-subdued px-5 py-4 border-b border-border-light">
                    <h4 className="font-semibold text-foreground" style={{ fontSize: 'var(--text-base)' }}>Detail Program Kontribusi</h4>
                  </div>
                  <div className="p-5 flex flex-col gap-4">
                    {selectedProgram.map((programIndex, idx) => {
                      const program = cardDetails[programIndex];
                      const contribution = formData.contributions[idx] || {};
                      const isRevitalisasiSekolah = program.title === "Revitalisasi Sekolah";
                      const isInfrastrukturDigital = program.title === "Infrastruktur Digital";
                      const isMultiSchoolProgram = isRevitalisasiSekolah || isInfrastrukturDigital;
                      
                      return (
                        <div key={idx} className="border border-border-light rounded-lg overflow-hidden">
                          <div className="px-4 py-3 border-b border-border-light">
                            <h5 className="font-semibold text-foreground" style={{ fontSize: '14px' }}>{idx + 1}. {program.title}</h5>
                          </div>

                          <div className="px-4 py-4 grid grid-cols-2 gap-3">
                            {/* Multi-school display for Revitalisasi & Infrastruktur Digital */}
                            {isMultiSchoolProgram && formData.contributions[idx]?.schools && formData.contributions[idx].schools.length > 0 ? (
                              <div className="col-span-2">
                                <div className="flex flex-col gap-2">
                                  {formData.contributions[idx].schools.map((schoolItem: any, schoolIdx: number) => {
                                    const isSingleSchool = formData.contributions[idx].schools.length === 1;
                                    return (
                                      <div key={`${idx}-${schoolItem.school.npsn}-${schoolIdx}`} className={isSingleSchool ? 'py-1' : 'p-2 border border-border-light rounded-lg'}>
                                        {/* Always show school name */}
                                        <p className="text-foreground" style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{schoolItem.school.name}</p>

                                        {/* Buildings for Revitalisasi Sekolah - Simplified */}
                                        {isRevitalisasiSekolah && schoolItem.selectedBuildings && schoolItem.selectedBuildings.length > 0 && (
                                          <p className="text-foreground" style={{ fontSize: '14px' }}>
                                            {revitalizationBuildings
                                              .filter((building) => schoolItem.selectedBuildings.includes(building.id))
                                              .map((building) => building.buildingName)
                                              .join(', ')}
                                          </p>
                                        )}

                                      {/* Packages for Infrastruktur Digital - Simplified */}
                                      {isInfrastrukturDigital && schoolItem.packages && schoolItem.packages.length > 0 && (
                                        <p className="text-foreground" style={{ fontSize: '14px' }}>
                                          {schoolItem.packages.map((pkg: string) => 
                                            pkg === 'internet' ? 'Jaringan Internet' : 
                                            pkg === 'electricity' ? 'Instalasi Listrik' : pkg
                                          ).join(', ')}
                                        </p>
                                      )}

                                      {/* Notes for this school */}
                                      {schoolItem.notes && (
                                        <div className="mt-3">
                                          <p className="text-subdued mb-0" style={{ fontSize: 'var(--text-xs)' }}>Catatan:</p>
                                          <p className="text-foreground" style={{ fontSize: '14px' }}>{schoolItem.notes}</p>
                                        </div>
                                      )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : null}
                            
                            {/* Selected Topics for non-multi-school programs */}
                            {!isMultiSchoolProgram && ((contribution.selectedTopics && contribution.selectedTopics.length > 0) || contribution.otherTopic) && (() => {
                              const programContent = getProgramContent(program.title);
                              
                              // Get regular labels (excluding "lainnya")
                              const selectedLabels = (contribution.selectedTopics || [])
                                .filter((t: string) => t !== 'lainnya')
                                .map((topicValue: string) => {
                                  const option = programContent?.options.find((opt: any) => opt.value === topicValue);
                                  return option?.label || topicValue;
                                });
                              
                              // Handle "Lainnya" separately with the user input
                              const hasLainnya = (contribution.selectedTopics || []).includes('lainnya') || contribution.otherTopic;
                              const lainnyaInput = contribution.otherTopic && contribution.otherTopic !== ' ' ? contribution.otherTopic : '';
                              
                              // Combine all items
                              const allItems: {label: string; isLainnya: boolean}[] = [
                                ...selectedLabels.map(label => ({ label, isLainnya: false })),
                                ...(hasLainnya ? [{ label: lainnyaInput || 'Lainnya', isLainnya: true }] : [])
                              ];
                              
                              return allItems.length > 0 ? (
                                <div className="col-span-2">
                                  <div className="flex flex-col gap-1">
                                    {allItems.map((item: {label: string; isLainnya: boolean}, idx: number) => (
                                      <p key={idx} className="text-foreground" style={{ fontSize: '14px' }}>
                                        • {item.isLainnya && lainnyaInput ? `Lainnya: ${lainnyaInput}` : item.label}
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              ) : null;
                            })()}

                            {/* Selected Audience & Jenjang for Bahan Ajar Digital */}
                            {!isMultiSchoolProgram && contribution.targetAudience && contribution.targetAudience.length > 0 && (() => {
                              const programContent = getProgramContent(program.title);
                              const jenjangMap: Record<string, string> = {};
                              programContent?.jenjangOptions.forEach((opt: any) => {
                                jenjangMap[opt.value] = opt.label;
                              });
                              
                              const guruLabels = (contribution.jenjangGuru || []).map((v: string) => jenjangMap[v] || v);
                              const muridLabels = (contribution.jenjangMurid || []).map((v: string) => jenjangMap[v] || v);
                              
                              return (
                                <div className="col-span-2 flex flex-col gap-2">
                                  {(contribution.targetAudience || []).includes('guru') && guruLabels.length > 0 && (
                                    <div>
                                      <p className="text-foreground mb-1" style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Guru</p>
                                      <div className="flex flex-wrap gap-1">
                                        {guruLabels.map((label: string, idx: number) => (
                                          <span key={`guru-${idx}`} className="px-2 py-1 bg-white border border-border-light rounded-full" style={{ fontSize: 'var(--text-xs)' }}>
                                            {label}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {(contribution.targetAudience || []).includes('murid') && muridLabels.length > 0 && (
                                    <div>
                                      <p className="text-foreground mb-1" style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Murid</p>
                                      <div className="flex flex-wrap gap-1">
                                        {muridLabels.map((label: string, idx: number) => (
                                          <span key={`murid-${idx}`} className="px-2 py-1 bg-white border border-border-light rounded-full" style={{ fontSize: 'var(--text-xs)' }}>
                                            {label}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                            
                            {contribution.type && (
                              <div>
                                <p className="text-subdued mb-1" style={{ fontSize: 'var(--text-xs)' }}>Jenis Kontribusi</p>
                                <p className="text-foreground" style={{ fontSize: '14px' }}>{contribution.type}</p>
                              </div>
                            )}

                            {contribution.amount && (
                              <div>
                                <p className="text-subdued mb-1" style={{ fontSize: 'var(--text-xs)' }}>Jumlah/Nominal</p>
                                <p className="text-foreground" style={{ fontSize: '14px' }}>{contribution.amount}</p>
                              </div>
                            )}

                            {/* Informasi Tambahan - hide for multi-school programs */}
                            {contribution.notes && !isMultiSchoolProgram && (
                              <div className="col-span-2 mt-1">
                                <p className="text-subdued mb-0" style={{ fontSize: 'var(--text-xs)' }}>Informasi Tambahan</p>
                                <p className="text-foreground whitespace-pre-wrap" style={{ fontSize: '14px' }}>{contribution.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Pernyataan */}
                <div className="border border-border-light rounded-lg overflow-hidden">
                  <div className="bg-surface-subdued px-5 py-4 border-b border-border-light">
                    <h4 className="font-semibold text-foreground" style={{ fontSize: 'var(--text-base)' }}>Pernyataan</h4>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="confirmation"
                        checked={isConfirmed}
                        onCheckedChange={setIsConfirmed}
                        className="mt-0.5"
                      />
                      <label htmlFor="confirmation" className="cursor-pointer flex-1">
                        <p className="text-foreground" style={{ fontSize: '14px' }}>
                          Saya menyatakan bahwa semua informasi yang saya berikan adalah benar dan dapat dipertanggungjawabkan.
                          Data ini akan digunakan untuk keperluan pencatatan dan koordinasi program kontribusi pendidikan.
                        </p>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Divider - Full Width */}
          <div className="w-full h-px bg-border-disabled" />

          {/* Footer Actions */}
          <div className="flex justify-between gap-spacing-4 p-spacing-6 bg-default">
            {currentStep > 1 && (
              <button
                onClick={handlePrevious}
                className="transition-opacity py-[var(--spacing-3)] px-[var(--spacing-6)] rounded-button bg-secondary text-secondary-foreground border border-border-light cursor-pointer hover:opacity-80"
                style={{
                  fontSize: 'var(--action-size)',
                  fontWeight: 'var(--action-weight)',
                  lineHeight: 'var(--action-height)',
                }}
              >
                Kembali
              </button>
            )}
            
            <div className="flex-1" />
            
            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                disabled={currentStep === 1 && selectedProgram.length === 0}
                className={`transition-colors py-[var(--spacing-3)] px-[var(--spacing-6)] rounded-button border-0 ${
                  currentStep === 1 && selectedProgram.length === 0
                    ? 'bg-[var(--surface-disabled)] text-[var(--text-disabled)] cursor-not-allowed opacity-60'
                    : 'bg-primary text-primary-foreground cursor-pointer'
                }`}
                style={{
                  fontSize: 'var(--action-size)',
                  fontWeight: 'var(--action-weight)',
                  lineHeight: 'var(--action-height)',
                }}
              >
                Lanjutkan
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!isConfirmed}
                className={`transition-colors py-[var(--spacing-3)] px-[var(--spacing-6)] rounded-button border-0 ${
                  isConfirmed
                    ? 'bg-primary text-primary-foreground cursor-pointer'
                    : 'bg-[var(--surface-disabled)] text-[var(--text-disabled)] cursor-not-allowed opacity-60'
                }`}
                style={{
                  fontSize: 'var(--action-size)',
                  fontWeight: 'var(--action-weight)',
                  lineHeight: 'var(--action-height)',
                }}
              >
                Kirim Kontribusi
              </button>
            )}
          </div>
        </div>
      </div>

      {showThankYou && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-lg w-full p-8 text-center shadow-lg">
            <img 
              src={imgTerimaKasih} 
              alt="Terima Kasih" 
              className="w-64 h-auto mx-auto mb-6"
            />
            <h2 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">
              Terima kasih sudah mengisi formulir kontribusi
            </h2>
            <p className="text-[var(--text-secondary)] mb-8 max-w-md mx-auto">
              Dengan mengirim formulir ini, Anda setuju untuk dihubungi pihak terkait dan melanjutkan proses kontribusi.
            </p>
            <button
              onClick={handleBackToHome}
              className="bg-primary text-primary-foreground py-3 px-6 rounded-button font-semibold hover:opacity-90 transition-opacity"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

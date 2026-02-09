"use client";

import { useState } from "react";

interface PersonalInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

interface DocumentInfo {
  idType: string;
  idNumber: string;
  idFile: File | null;
  idFileBack: File | null;
  addressFile: File | null;
}

export default function KYCPage() {
  const [step, setStep] = useState(1);
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    nationality: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
  });
  const [documentInfo, setDocumentInfo] = useState<DocumentInfo>({
    idType: "",
    idNumber: "",
    idFile: null,
    idFileBack: null,
    addressFile: null,
  });

  const handlePersonalInfoChange = (field: keyof PersonalInfo, value: string) => {
    setPersonalInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleDocumentInfoChange = (field: keyof DocumentInfo, value: string | File | null) => {
    setDocumentInfo((prev) => ({ ...prev, [field]: value }));
  };

  const isPersonalInfoValid = () => {
    return (
      personalInfo.firstName &&
      personalInfo.lastName &&
      personalInfo.dateOfBirth &&
      personalInfo.nationality &&
      personalInfo.address &&
      personalInfo.city &&
      personalInfo.postalCode &&
      personalInfo.country
    );
  };

  const isDocumentInfoValid = () => {
    const baseValid = documentInfo.idType && documentInfo.idNumber && documentInfo.idFile;
    // Driver's license requires back of document
    if (documentInfo.idType === "drivers_license") {
      return baseValid && documentInfo.idFileBack;
    }
    return baseValid;
  };

  const isAddressProofValid = () => {
    return documentInfo.addressFile !== null;
  };

  const handleSubmit = () => {
    // In a real app, submit to backend
    setStep(5);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-2 text-3xl font-bold text-black dark:text-white">
        KYC Verification
      </h1>
      <p className="mb-8 text-body-color dark:text-body-color-dark">
        Complete your identity verification to unlock all features
      </p>

      {/* Progress Steps */}
      <div className="mb-8 flex items-center justify-between">
        {[1, 2, 3, 4, 5].map((num) => (
          <div key={num} className="flex flex-1 items-center">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                step >= num
                  ? "bg-primary text-white"
                  : "bg-gray-200 text-gray-500 dark:bg-gray-800"
              }`}
            >
              {step > num ? (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <span className="text-sm font-semibold">{num}</span>
              )}
            </div>
            {num < 5 && (
              <div
                className={`mx-2 h-1 flex-1 ${
                  step > num
                    ? "bg-primary"
                    : "bg-gray-200 dark:bg-gray-800"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Personal Information */}
      {step === 1 && (
        <div className="rounded-xl bg-white p-8 shadow-lg dark:bg-gray-dark">
          <h2 className="mb-6 text-2xl font-bold text-black dark:text-white">
            Personal Information
          </h2>
          <p className="mb-6 text-sm text-body-color dark:text-body-color-dark">
            Please provide your personal details exactly as they appear on your government-issued ID.
          </p>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-black dark:text-white">
                  First Name *
                </label>
                <input
                  type="text"
                  value={personalInfo.firstName}
                  onChange={(e) => handlePersonalInfoChange("firstName", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-black outline-none focus:border-primary dark:border-gray-800 dark:bg-gray-800 dark:text-white"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-black dark:text-white">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={personalInfo.lastName}
                  onChange={(e) => handlePersonalInfoChange("lastName", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-black outline-none focus:border-primary dark:border-gray-800 dark:bg-gray-800 dark:text-white"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-black dark:text-white">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  value={personalInfo.dateOfBirth}
                  onChange={(e) => handlePersonalInfoChange("dateOfBirth", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-black outline-none focus:border-primary dark:border-gray-800 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-black dark:text-white">
                  Nationality *
                </label>
                <input
                  type="text"
                  value={personalInfo.nationality}
                  onChange={(e) => handlePersonalInfoChange("nationality", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-black outline-none focus:border-primary dark:border-gray-800 dark:bg-gray-800 dark:text-white"
                  placeholder="United States"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-black dark:text-white">
                Street Address *
              </label>
              <input
                type="text"
                value={personalInfo.address}
                onChange={(e) => handlePersonalInfoChange("address", e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-black outline-none focus:border-primary dark:border-gray-800 dark:bg-gray-800 dark:text-white"
                placeholder="123 Main Street, Apt 4B"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-semibold text-black dark:text-white">
                  City *
                </label>
                <input
                  type="text"
                  value={personalInfo.city}
                  onChange={(e) => handlePersonalInfoChange("city", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-black outline-none focus:border-primary dark:border-gray-800 dark:bg-gray-800 dark:text-white"
                  placeholder="New York"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-black dark:text-white">
                  Postal Code *
                </label>
                <input
                  type="text"
                  value={personalInfo.postalCode}
                  onChange={(e) => handlePersonalInfoChange("postalCode", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-black outline-none focus:border-primary dark:border-gray-800 dark:bg-gray-800 dark:text-white"
                  placeholder="10001"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-black dark:text-white">
                  Country *
                </label>
                <input
                  type="text"
                  value={personalInfo.country}
                  onChange={(e) => handlePersonalInfoChange("country", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-black outline-none focus:border-primary dark:border-gray-800 dark:bg-gray-800 dark:text-white"
                  placeholder="USA"
                />
              </div>
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!isPersonalInfoValid()}
            className="mt-6 w-full rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      )}

      {/* Step 2: Identity Document */}
      {step === 2 && (
        <div className="rounded-xl bg-white p-8 shadow-lg dark:bg-gray-dark">
          <h2 className="mb-6 text-2xl font-bold text-black dark:text-white">
            Identity Document
          </h2>
          <p className="mb-6 text-sm text-body-color dark:text-body-color-dark">
            Upload a clear photo of your government-issued ID. Ensure all details are visible.
          </p>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-black dark:text-white">
                Document Type *
              </label>
              <select
                value={documentInfo.idType}
                onChange={(e) => handleDocumentInfoChange("idType", e.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-3 text-black outline-none focus:border-primary dark:border-gray-800 dark:bg-gray-800 dark:text-white [&>option]:bg-white [&>option]:text-black [&>option]:dark:bg-gray-800 [&>option]:dark:text-white"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '20px' }}
              >
                <option value="">Select document type</option>
                <option value="passport">Passport</option>
                <option value="drivers_license">Driver&apos;s License</option>
                <option value="national_id">National ID Card</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-black dark:text-white">
                Document Number *
              </label>
              <input
                type="text"
                value={documentInfo.idNumber}
                onChange={(e) => handleDocumentInfoChange("idNumber", e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-black outline-none focus:border-primary dark:border-gray-800 dark:bg-gray-800 dark:text-white"
                placeholder="Enter document number"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-black dark:text-white">
                Upload Document {documentInfo.idType === "drivers_license" ? "(Front) " : ""}*
              </label>
              <div className="rounded-lg border-2 border-dashed border-gray-200 p-6 text-center dark:border-gray-800">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleDocumentInfoChange("idFile", e.target.files?.[0] || null)}
                  className="hidden"
                  id="id-upload"
                />
                <label htmlFor="id-upload" className="cursor-pointer">
                  <svg
                    className="mx-auto mb-3 h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  {documentInfo.idFile ? (
                    <p className="mx-auto max-w-full truncate px-4 text-sm font-medium text-black dark:text-white">
                      {documentInfo.idFile.name}
                    </p>
                  ) : (
                    <>
                      <p className="mb-2 text-sm font-medium text-black dark:text-white">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-body-color dark:text-body-color-dark">
                        PNG, JPG or PDF (max. 10MB)
                      </p>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Back of Driver's License */}
            {documentInfo.idType === "drivers_license" && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-black dark:text-white">
                  Upload Document (Back) *
                </label>
                <div className="rounded-lg border-2 border-dashed border-gray-200 p-6 text-center dark:border-gray-800">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleDocumentInfoChange("idFileBack", e.target.files?.[0] || null)}
                    className="hidden"
                    id="id-upload-back"
                  />
                  <label htmlFor="id-upload-back" className="cursor-pointer">
                    <svg
                      className="mx-auto mb-3 h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    {documentInfo.idFileBack ? (
                      <p className="mx-auto max-w-full truncate px-4 text-sm font-medium text-black dark:text-white">
                        {documentInfo.idFileBack.name}
                      </p>
                    ) : (
                      <>
                        <p className="mb-2 text-sm font-medium text-black dark:text-white">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-body-color dark:text-body-color-dark">
                          PNG, JPG or PDF (max. 10MB)
                        </p>
                      </>
                    )}
                  </label>
                </div>
              </div>
            )}

            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Requirements:</strong> Document must be valid, not expired, and all information must be clearly visible. Both sides of the ID may be required.
              </p>
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <button
              onClick={() => setStep(1)}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-6 py-3 font-semibold text-black transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!isDocumentInfoValid()}
              className="flex-1 rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Address Proof */}
      {step === 3 && (
        <div className="rounded-xl bg-white p-8 shadow-lg dark:bg-gray-dark">
          <h2 className="mb-6 text-2xl font-bold text-black dark:text-white">
            Proof of Address
          </h2>
          <p className="mb-6 text-sm text-body-color dark:text-body-color-dark">
            Upload a document that verifies your residential address. Must be dated within the last 3 months.
          </p>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-black dark:text-white">
                Upload Proof of Address *
              </label>
              <div className="rounded-lg border-2 border-dashed border-gray-200 p-6 text-center dark:border-gray-800">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleDocumentInfoChange("addressFile", e.target.files?.[0] || null)}
                  className="hidden"
                  id="address-upload"
                />
                <label htmlFor="address-upload" className="cursor-pointer">
                  <svg
                    className="mx-auto mb-3 h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  {documentInfo.addressFile ? (
                    <p className="mx-auto max-w-full truncate px-4 text-sm font-medium text-black dark:text-white">
                      {documentInfo.addressFile.name}
                    </p>
                  ) : (
                    <>
                      <p className="mb-2 text-sm font-medium text-black dark:text-white">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-body-color dark:text-body-color-dark">
                        PNG, JPG or PDF (max. 10MB)
                      </p>
                    </>
                  )}
                </label>
              </div>
            </div>

            <div className="space-y-3 rounded-lg bg-gray-50 p-4 dark:bg-black/20">
              <p className="text-sm font-semibold text-black dark:text-white">
                Acceptable documents:
              </p>
              <ul className="space-y-1 text-sm text-body-color dark:text-body-color-dark">
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Utility bill (electricity, water, gas)
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Bank statement
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Government-issued letter or tax document
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Lease or rental agreement
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <button
              onClick={() => setStep(2)}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-6 py-3 font-semibold text-black transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
            >
              Back
            </button>
            <button
              onClick={() => setStep(4)}
              disabled={!isAddressProofValid()}
              className="flex-1 rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Review & Submit */}
      {step === 4 && (
        <div className="rounded-xl bg-white p-8 shadow-lg dark:bg-gray-dark">
          <h2 className="mb-6 text-2xl font-bold text-black dark:text-white">
            Review & Submit
          </h2>
          <p className="mb-6 text-sm text-body-color dark:text-body-color-dark">
            Please review your information before submitting. You can go back to make changes if needed.
          </p>

          <div className="space-y-6">
            {/* Personal Information Summary */}
            <div className="rounded-lg bg-gray-50 p-4 dark:bg-black/20">
              <h3 className="mb-3 font-semibold text-black dark:text-white">
                Personal Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-body-color dark:text-body-color-dark">Name:</span>
                  <span className="font-medium text-black dark:text-white">
                    {personalInfo.firstName} {personalInfo.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-body-color dark:text-body-color-dark">Date of Birth:</span>
                  <span className="font-medium text-black dark:text-white">
                    {personalInfo.dateOfBirth}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-body-color dark:text-body-color-dark">Nationality:</span>
                  <span className="font-medium text-black dark:text-white">
                    {personalInfo.nationality}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-body-color dark:text-body-color-dark">Address:</span>
                  <span className="font-medium text-black dark:text-white text-right">
                    {personalInfo.address}, {personalInfo.city}, {personalInfo.postalCode}, {personalInfo.country}
                  </span>
                </div>
              </div>
            </div>

            {/* Document Information Summary */}
            <div className="rounded-lg bg-gray-50 p-4 dark:bg-black/20">
              <h3 className="mb-3 font-semibold text-black dark:text-white">
                Documents
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-body-color dark:text-body-color-dark">ID Type:</span>
                  <span className="font-medium text-black dark:text-white capitalize">
                    {documentInfo.idType.replace("_", " ")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-body-color dark:text-body-color-dark">ID Number:</span>
                  <span className="font-medium text-black dark:text-white">
                    {documentInfo.idNumber}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="flex-shrink-0 text-body-color dark:text-body-color-dark">
                    ID Document {documentInfo.idType === "drivers_license" ? "(Front)" : ""}:
                  </span>
                  <span className="truncate font-medium text-black dark:text-white">
                    {documentInfo.idFile?.name}
                  </span>
                </div>
                {documentInfo.idType === "drivers_license" && documentInfo.idFileBack && (
                  <div className="flex justify-between gap-2">
                    <span className="flex-shrink-0 text-body-color dark:text-body-color-dark">ID Document (Back):</span>
                    <span className="truncate font-medium text-black dark:text-white">
                      {documentInfo.idFileBack.name}
                    </span>
                  </div>
                )}
                <div className="flex justify-between gap-2">
                  <span className="flex-shrink-0 text-body-color dark:text-body-color-dark">Address Proof:</span>
                  <span className="truncate font-medium text-black dark:text-white">
                    {documentInfo.addressFile?.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
              <div className="flex gap-3">
                <svg
                  className="h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="text-sm">
                  <p className="font-semibold text-yellow-800 dark:text-yellow-300">
                    Important Notice
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-400">
                    By submitting this verification, you confirm that all information provided is accurate and complete. False information may result in account suspension.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <button
              onClick={() => setStep(3)}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-6 py-3 font-semibold text-black transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary/90"
            >
              Submit Verification
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Success */}
      {step === 5 && (
        <div className="rounded-xl bg-white p-8 text-center shadow-lg dark:bg-gray-dark">
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <svg
                className="h-10 w-10 text-green-600 dark:text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          <h2 className="mb-2 text-2xl font-bold text-black dark:text-white">
            Verification Submitted!
          </h2>
          <p className="mb-8 text-body-color dark:text-body-color-dark">
            Your KYC verification has been submitted successfully.
          </p>

          <div className="mb-6 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>What happens next?</strong><br />
              Our team will review your documents within 24-48 hours. You'll receive an email notification once your verification is complete. In the meantime, you can continue using limited account features.
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 p-4 text-left dark:bg-black/20">
            <p className="mb-2 text-sm font-semibold text-black dark:text-white">
              Verification Status: Pending Review
            </p>
            <div className="mb-3 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
              <div className="h-2 w-1/2 rounded-full bg-primary"></div>
            </div>
            <p className="text-xs text-body-color dark:text-body-color-dark">
              Average review time: 24-48 hours
            </p>
          </div>

          <button
            onClick={() => window.location.href = "/dashboard/security"}
            className="mt-6 w-full rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary/90"
          >
            Back to Security Settings
          </button>
        </div>
      )}
    </div>
  );
}

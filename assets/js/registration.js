// Service Categories and Subcategories Mapping
const CATEGORY_MAP = {
    "Home & Garden": [
        { value: "plumbing", text: "Plumbing" },
        { value: "electrical-services", text: "Electrical Services" },
        { value: "hvac", text: "HVAC (Heating & Cooling)" },
        { value: "home-cleaning", text: "Home Cleaning" },
        { value: "landscaping", text: "Landscaping & Gardening" },
        { value: "painting-services", text: "Painting Services" },
        { value: "carpentry", text: "Carpentry" },
        { value: "moving-services", text: "Moving Services" },
        { value: "appliance-repair", text: "Appliance Repair" },
        { value: "roofing-services", text: "Roofing" },
        { value: "locksmith-services", text: "Locksmith" },
        { value: "handyman-services", text: "Handyman / Contractors" }
    ],
    "Health & Beauty": [
        { value: "hair-salon", text: "Hair Salon" },
        { value: "nail-salon", text: "Nail Salon" },
        { value: "spa-services", text: "Spa Services" },
        { value: "massage-therapy", text: "Massage Therapy" },
        { value: "wellness-services", text: "Wellness (General)" },
        { value: "beauty-general", text: "Beauty (General)" }
    ],
    "Auto & Business Services": [ // Combined for brevity in main categories
        { value: "auto-repair", text: "Auto Repair & Mechanic" },
        { value: "car-wash", text: "Car Wash & Detailing" },
        { value: "it-services", text: "IT & Tech Support" },
        { value: "marketing-services", text: "Marketing & Advertising" },
        { value: "legal-services", text: "Legal Services" },
        { value: "accounting-services", text: "Accounting & Bookkeeping" },
        { value: "business-consulting", text: "Business Consulting" },
        { value: "graphic-design", text: "Graphic & Web Design" }
    ],
    "Lifestyle & Events": [
        { value: "tutoring-lessons", text: "Tutoring & Lessons" },
        { value: "event-planning", text: "Event Planning" },
        { value: "photography-services", text: "Photography & Videography" },
        { value: "pet-grooming", text: "Pet Grooming" },
        { value: "pet-sitting", text: "Pet Sitting & Care" },
        { value: "real-estate-services", text: "Real Estate Agents" },
        { value: "fitness-training", text: "Fitness & Personal Training" },
        { value: "catering-services", text: "Catering Services" }
    ],
    "Other Services": [
        { value: "other", text: "Other" }
    ]
};

// File Upload Preview Component
class FileUploadPreview {
    constructor(inputElement, previewContainer) {
        this.input = inputElement;
        this.previewContainer = previewContainer;
        this.allowedTypes = [
            'image/jpeg', // Common images
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf', // PDFs
            'text/plain', // .txt files
            'application/msword', // .doc files (older Word)
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx files (modern Word)
            'application/vnd.ms-excel', // .xls files (older Excel)
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx files (modern Excel)
            'application/vnd.ms-powerpoint', // .ppt files (older PowerPoint)
            'application/vnd.openxmlformats-officedocument.presentationml.presentation' // .pptx files (modern PowerPoint)
        ];
        this.maxFileSize = 5 * 1024 * 1024; // 5MB

        if (this.input) {
        this.input.addEventListener('change', this.handleFileSelect.bind(this));
        }
    }

    handleFileSelect(event) {
        const files = Array.from(event.target.files);
        if (!this.previewContainer) return;
        this.previewContainer.innerHTML = '';

        files.forEach(file => {
            if (!this.validateFile(file)) return;

            const preview = document.createElement('div');
            preview.className = 'file-preview-item d-flex align-items-center';
            const icon = document.createElement('i');
            icon.className = 'file-icon fa ' + this.getFileIcon(file.type);
            const info = document.createElement('div');
            info.className = 'file-info';
            const name = document.createElement('div');
            name.className = 'file-name';
            name.textContent = file.name;
            const size = document.createElement('div');
            size.className = 'file-size';
            size.textContent = this.formatFileSize(file.size);
            const remove = document.createElement('i');
            remove.className = 'file-remove fa fa-times';
            remove.addEventListener('click', () => {
                preview.remove();
                if (this.input) this.input.value = ''; // Clear the file input
            });
            info.appendChild(name);
            info.appendChild(size);
            preview.appendChild(icon);
            preview.appendChild(info);
            preview.appendChild(remove);
            this.previewContainer.appendChild(preview);
        });
    }

    validateFile(file) {
        if (!this.allowedTypes.includes(file.type)) {
            alert(`File type ${file.type} is not allowed. Please upload JPG, PNG, or PDF files.`);
            if (this.input) this.input.value = ''; // Clear the invalid file
            return false;
        }
        if (file.size > this.maxFileSize) {
            alert(`File size exceeds 5MB limit. Please choose a smaller file.`);
            if (this.input) this.input.value = ''; // Clear the invalid file
            return false;
        }
        return true;
    }

    getFileIcon(fileType) {
        if (fileType.includes('image')) return 'fa-file-image-o';
        if (fileType.includes('pdf')) return 'fa-file-pdf-o';
        return 'fa-file-o';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Form Validation Component (basic structure, can be expanded)
class FormValidator {
    constructor(form) {
        this.form = form;
        // Further validation logic can be added here
    }
    // Validation methods would go here
}

// Form Toggle Component
class FormToggle {
    constructor() {
        this.consumerBtn = document.querySelector('.form-toggle-btn[data-form="consumer"]');
        this.providerBtn = document.querySelector('.form-toggle-btn[data-form="provider"]');
        this.consumerForm = document.getElementById('consumer-form');
        this.providerForm = document.getElementById('provider-form');
        this.setupToggle();
    }

    setupToggle() {
        if (!this.consumerBtn || !this.providerBtn || !this.consumerForm || !this.providerForm) return;

        this.consumerBtn.addEventListener('click', () => this.switchForm('consumer'));
        this.providerBtn.addEventListener('click', () => this.switchForm('provider'));
    }

    switchForm(targetForm) {
        if (targetForm === 'consumer') {
            this.consumerForm.classList.remove('d-none');
            this.providerForm.classList.add('d-none');
            this.consumerBtn.classList.add('active');
            this.providerBtn.classList.remove('active');
        } else {
            this.consumerForm.classList.add('d-none');
            this.providerForm.classList.remove('d-none');
            this.consumerBtn.classList.remove('active');
            this.providerBtn.classList.add('active');
        }
    }
}

// Multi-Step Provider Form Wizard
function initProviderWizard() {
    const providerFormInner = document.getElementById('provider-form-inner');
    if (!providerFormInner) {
        console.warn("Provider form inner container not found. Wizard cannot initialize.");
        return;
    }

    const steps = Array.from(providerFormInner.querySelectorAll('.form-step'));
    const progressSteps = Array.from(providerFormInner.querySelectorAll('.progress-step'));
    
    // Correctly select buttons by ID
    const nextButton = document.getElementById('next-step');
    const prevButton = document.getElementById('prev-step');
    const submitButton = document.getElementById('submit-form');

    if (!nextButton || !prevButton || !submitButton) {
        console.warn("One or more navigation buttons (next, prev, submit) not found. Wizard may not function correctly.");
        // Depending on requirements, you might return here or allow partial functionality
    }

    let currentStepIndex = 0;

    function updateButtonVisibility() {
        if (!prevButton || !nextButton || !submitButton) return; // Ensure buttons exist

        prevButton.style.display = currentStepIndex === 0 ? 'none' : 'inline-block';
        
        if (currentStepIndex === steps.length - 1) {
            nextButton.style.display = 'none';
            submitButton.style.display = 'inline-block';
            } else {
            nextButton.style.display = 'inline-block';
            submitButton.style.display = 'none';
        }
    }

    function showStep(stepIndexToShow) {
        steps.forEach((step, index) => {
            step.classList.toggle('d-none', index !== stepIndexToShow);
        });
        progressSteps.forEach((pStep, index) => {
            pStep.classList.toggle('active', index === stepIndexToShow);
            pStep.classList.toggle('completed', index < stepIndexToShow);
        });
        currentStepIndex = stepIndexToShow;
        updateButtonVisibility(); // Call to update button visibility
    }

    function validateStep(stepIndex) {
        if (!steps[stepIndex]) return false;
        const currentStepFields = steps[stepIndex].querySelectorAll('input[required], select[required], textarea[required]');
        let allValid = true;
        currentStepFields.forEach(field => {
        let isValid = true;
            if (field.disabled || field.closest('.d-none')) { 
                // Skip validation for disabled fields or fields in non-visible parent elements (like a hidden step)
            } else if (field.type === 'checkbox') {
                isValid = field.checked;
            } else if (field.type === 'select-one') {
                isValid = field.value !== '';
            } else {
                isValid = field.value.trim() !== '';
            }

            if (isValid) {
                field.classList.remove('is-invalid');
            } else {
                field.classList.add('is-invalid');
                allValid = false;
            }
        });
        return allValid;
    }

    if (nextButton) {
        nextButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentStepIndex === steps.length - 1) {
                // On the last step, the next button should be hidden and submit visible.
                // This click shouldn't happen if visibility logic is correct.
                return; 
            }
            if (validateStep(currentStepIndex)) {
                showStep(currentStepIndex + 1);
            }
        });
    }

    if (prevButton) {
        prevButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentStepIndex > 0) {
                showStep(currentStepIndex - 1);
            }
        });
    }
    
    if (steps.length > 0) {
        showStep(0); // Initial step display
    } else {
        console.warn("No form steps found in the provider wizard.");
        // Hide all nav buttons if no steps
        if(nextButton) nextButton.style.display = 'none';
        if(prevButton) prevButton.style.display = 'none';
        if(submitButton) submitButton.style.display = 'none';
    }
}

class CategorySelector {
    constructor() {
        this.mainCategorySelect = document.getElementById('provider-service-category');
        this.subCategorySelect = document.getElementById('provider-service-subcategory');
        this.setupCategorySelection();
    }

    setupCategorySelection() {
        if (!this.mainCategorySelect || !this.subCategorySelect) {
            // console.warn("Category select elements not found for registration form.");
            return;
        }

        this.mainCategorySelect.innerHTML = '<option value="">Select Main Category…</option>'; 
        for (const mainCategoryText in CATEGORY_MAP) {
            const option = document.createElement('option');
            option.value = mainCategoryText; 
            option.textContent = mainCategoryText;
            this.mainCategorySelect.appendChild(option);
        }

        this.mainCategorySelect.addEventListener('change', () => this.updateSubcategories());
        this.updateSubcategories(); // Initial call to set subcategories if a main category is pre-selected or to disable
    }

    updateSubcategories() {
        const selectedMainCategoryKey = this.mainCategorySelect.value;
        this.subCategorySelect.innerHTML = '<option value="">Select Subcategory…</option>'; 

        if (selectedMainCategoryKey && CATEGORY_MAP[selectedMainCategoryKey]) {
            this.subCategorySelect.disabled = false;
            CATEGORY_MAP[selectedMainCategoryKey].forEach(subCategory => {
                const option = document.createElement('option');
                option.value = subCategory.value; 
                option.textContent = subCategory.text; 
                this.subCategorySelect.appendChild(option);
            });
        } else {
            this.subCategorySelect.disabled = true;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!window.supabase) {
        console.error("Supabase client is not initialized. Make sure supabase.js is loaded correctly.");
        const errorDiv = document.getElementById('error-message') || document.createElement('div');
        if (!document.getElementById('error-message')) {
            const formsContainer = document.querySelector('.form-toggle');
            if (formsContainer) formsContainer.insertAdjacentElement('beforebegin', errorDiv);
            else document.body.insertAdjacentElement('afterbegin', errorDiv); // Fallback
        }
        errorDiv.id = 'error-message';
        errorDiv.className = 'alert alert-danger';
        errorDiv.textContent = 'Critical error: Could not connect to services. Please try refreshing the page.';
        return; 
    }
    
    new FormToggle();
    initProviderWizard();
    new CategorySelector();

    const idUploadInput = document.getElementById('business-registration');
    const idPreviewContainer = document.getElementById('provider-id-preview');
    if (idUploadInput && idPreviewContainer) {
        new FileUploadPreview(idUploadInput, idPreviewContainer);
    }

    const businessLicenseInput = document.getElementById('licenses');
    const businessLicensePreview = document.getElementById('provider-business-license-preview');
    if (businessLicenseInput && businessLicensePreview) {
        new FileUploadPreview(businessLicenseInput, businessLicensePreview);
    }
    
    const consumerFormElement = document.getElementById('consumer-form')?.querySelector('form');
    if (consumerFormElement) {
        // new FormValidator(consumerFormElement); // Basic validator, can be enhanced
    }

    const providerFormElement = document.getElementById('provider-form-inner');
    if (providerFormElement) {
        providerFormElement.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log("Provider registration form submitted.");

            // Validate all fields across all steps before final submission
            const allWizardFields = providerFormElement.querySelectorAll('.form-step input[required], .form-step select[required], .form-step textarea[required]');
            let allStepsValid = true;
            allWizardFields.forEach(field => {
                let fieldValid = true;
                if (field.closest('.form-step').contains(field)) { // Ensure field is part of a step
                    if (field.type === 'checkbox') fieldValid = field.checked;
                    else if (field.type === 'select-one') fieldValid = field.value !== '';
                    else fieldValid = field.value.trim() !== '';

                    if (!fieldValid) {
                        field.classList.add('is-invalid');
                        allStepsValid = false;
                    } else {
                        field.classList.remove('is-invalid');
                    }
                }
            });
            
            const selectedSubCategoryInput = document.getElementById('provider-service-subcategory');
            const selectedSubCategory = selectedSubCategoryInput.value;

            if (!selectedSubCategory) {
                alert("Please select your primary service sub-category in the 'Business Information' step.");
                selectedSubCategoryInput.classList.add('is-invalid');
                allStepsValid = false;
            } else {
                selectedSubCategoryInput.classList.remove('is-invalid');
            }

            if (!allStepsValid) {
                alert("Please complete all required fields in all steps, including your service category.");
                // Attempt to show the first invalid step (complex to implement perfectly here)
                // For simplicity, user needs to check all steps.
                return;
            }

            const submitButton = providerFormElement.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating Account...';

            try {
                // Directly get first name and last name from their respective input fields
                const firstNameValue = document.getElementById('provider-first-name').value;
                const lastNameValue = document.getElementById('provider-last-name').value;
                const emailValue = document.getElementById('provider-email').value;
                const phoneValue = document.getElementById('provider-phone').value;
                const passwordValue = document.getElementById('provider-password').value;
                
                const { data: authData, error: authError } = await window.supabase.auth.signUp({
                    email: emailValue,
                    password: passwordValue,
                    options: {
                        data: { 
                            firstName: firstNameValue,   // camelCase for trigger compatibility
                            lastName: lastNameValue,     // camelCase for trigger compatibility
                            phone: phoneValue,    
                            role: 'provider' 
                        }
                    }
                });

                if (authError) throw authError;
                if (!authData.user) throw new Error("User registration failed, no user returned.");

                // The profileData object is primarily for constructing profileDataToUpdate now
                const profileData = {
                    id: authData.user.id,
                    email: emailValue,
                    primary_service_category: selectedSubCategory,
                    business_name: document.getElementById('provider-business-name')?.value || null,
                    id_document_url: null,
                    business_license_url: null 
                };
                
                // Add other fields from form to profileData if they exist
                const businessNameEl = document.getElementById('provider-business-name');
                if (businessNameEl) profileData.business_name = businessNameEl.value;
                
                const idFileInput = document.getElementById('business-registration'); // Corrected ID
                const idFile = idFileInput ? idFileInput.files[0] : null;
                if (idFile) {
                   console.log("ID File selected, attempting upload:", idFile.name);
                   // Example: Upload to 'provider-documents' bucket, in a folder by user ID, now with public/ prefix
                   const filePath = `public/${authData.user.id}/id_document/${idFile.name}`; // Ensure 'public/' prefix
                   const { data: uploadData, error: uploadError } = await window.supabase.storage
                       .from('provider-documents') 
                       .upload(filePath, idFile, {
                           cacheControl: '3600',
                           upsert: true // Overwrite if file with same name exists
                       });
                   if (uploadError) {
                       console.error("Error uploading ID Document:", uploadError);
                   } else {
                       console.log("ID Document uploaded:", uploadData);
                       const { data: urlData } = window.supabase.storage.from('provider-documents').getPublicUrl(uploadData.path);
                       profileData.id_document_url = urlData.publicUrl;
                   }
                }

                const licenseFileInput = document.getElementById('licenses'); 
                const licenseFiles = licenseFileInput ? Array.from(licenseFileInput.files) : []; 
                if (licenseFiles.length > 0) {
                    const licenseFileToUpload = licenseFiles[0]; 
                    console.log("License File selected, attempting upload:", licenseFileToUpload.name);
                    // Example: Upload to 'provider-documents' bucket, in a folder by user ID, now with public/ prefix
                    const filePath = `public/${authData.user.id}/business_license/${licenseFileToUpload.name}`; // Ensure 'public/' prefix
                    const { data: uploadData, error: uploadError } = await window.supabase.storage
                        .from('provider-documents')
                        .upload(filePath, licenseFileToUpload, {
                            cacheControl: '3600',
                            upsert: true
                        });
                    if (uploadError) {
                        console.error("Error uploading Business License:", uploadError);
                    } else {
                        console.log("Business License uploaded:", uploadData);
                        const { data: urlData } = window.supabase.storage.from('provider-documents').getPublicUrl(uploadData.path);
                        profileData.business_license_url = urlData.publicUrl; 
                    }
                }

                // Construct the data object for UPDATING the profile
                const profileDataToUpdate = {
                    primary_service_category: selectedSubCategory,
                    email: emailValue,
                };

                if (profileData.business_name) {
                    profileDataToUpdate.business_name = profileData.business_name;
                }
                if (profileData.id_document_url) {
                    profileDataToUpdate.id_document_url = profileData.id_document_url;
                }
                if (profileData.business_license_url) {
                    profileDataToUpdate.business_license_url = profileData.business_license_url;
                }

                // Perform the UPDATE operation on the 'profiles' table
                console.log("Attempting to update profile with data:", profileDataToUpdate);
                const { error: updateError } = await window.supabase
                    .from('profiles')
                    .update(profileDataToUpdate)
                    .eq('id', authData.user.id); // Match the user ID

                if (updateError) {
                    console.error("Error updating profile:", updateError);
                    // This could be an RLS issue on update, or a type mismatch for one of the updated columns.
                    throw new Error(`Failed to update profile information: ${updateError.message}. User auth record created but profile update failed.`);
                }

                console.log('Provider profile updated successfully.');
                providerFormElement.reset(); 
                window.location.href = 'provider-dashboard.html';

            } catch (error) {
                console.error('Error creating provider account:', error);
                let userMessage = `Error: ${error.message || 'Could not create account. Please try again.'}`;
                if (error.message && error.message.toLowerCase().includes("user already registered")) {
                    userMessage = "This email is already registered. Please sign in or use a different email.";
                } else if (error.message && error.message.toLowerCase().includes("password should be at least 6 characters")) {
                     userMessage = "Password is too short. It should be at least 6 characters long.";
                } else if (error.message && error.message.includes("profiles_pkey")) {
                    userMessage = "A profile for this user ID already exists. This may indicate a previous incomplete registration."
                }
                
                const errorDiv = document.getElementById('error-message') || document.createElement('div');
                 if (!document.getElementById('error-message')) {
                    const formsContainer = document.querySelector('.form-toggle');
                    if (formsContainer) formsContainer.insertAdjacentElement('beforebegin', errorDiv);
                    else providerFormElement.insertAdjacentElement('beforebegin', errorDiv);
                }
                errorDiv.id = 'error-message'; 
                errorDiv.className = 'alert alert-danger mt-3'; 
                errorDiv.textContent = userMessage;

                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText; 
            } 
        });
    }
}); 
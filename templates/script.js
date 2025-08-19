document.addEventListener('DOMContentLoaded', () => {
    const steps = document.querySelectorAll('.step');
    const progress = document.getElementById('progress');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const agreeBtn = document.getElementById('agreeBtn');
    const mainFormContainer = document.getElementById('mainFormContainer');
    const thankYouMessage = document.getElementById('thankYouMessage');
    const reviewContent = document.getElementById('reviewContent');

    let currentStep = 0;
    const formData = {};

    // --- Signature Pad Logic (no changes needed here) ---
    const canvas = document.getElementById('signatureCanvas');
    const ctx = canvas.getContext('2d');
    let drawing = false;

    function getPointerPos(e) {
        const rect = canvas.getBoundingClientRect();
        if (e.touches) {
            return {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top
            };
        } else {
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        }
    }
    
    function startDraw(e) {
        drawing = true;
        const pos = getPointerPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    }
    
    function draw(e) {
        if (!drawing) return;
        e.preventDefault();
        const pos = getPointerPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.strokeStyle = "#222";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
    }
    
    function stopDraw() {
        if (drawing) {
            drawing = false;
            ctx.closePath();
            formData.signature = canvas.toDataURL();
        }
    }
    
    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDraw);
    canvas.addEventListener('mouseleave', stopDraw);
    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDraw);
    
    document.getElementById('clearBtn').addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        formData.signature = null;
    });

    // --- Core Form Logic ---
    function showStep(index) {
        steps.forEach((step, i) => {
            step.classList.toggle('active', i === index);
        });
        progress.textContent = `Step ${index + 1} of ${steps.length}`;
        
        // This is the corrected logic for showing/hiding buttons
        prevBtn.style.display = (index === 0) ? 'none' : 'inline-block';
        nextBtn.style.display = (index === steps.length - 1) ? 'none' : 'inline-block';
        agreeBtn.style.display = (index === steps.length - 1) ? 'inline-block' : 'none';
        
        if (index === steps.length - 1) {
            displayReviewSummary();
        }
    }

    function collectAllFormData() {
        const textInputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="date"], input[type="number"], input[type="tel"]');
        textInputs.forEach(input => {
            const key = input.id.replace('Input', '').replace('Select', '');
            formData[key] = input.value;
        });

        const radioInputs = document.querySelectorAll('input[type="radio"]:checked');
        radioInputs.forEach(radio => {
            formData[radio.name] = radio.value;
        });
        
        const selectInputs = document.querySelectorAll('select');
        selectInputs.forEach(select => {
            formData[select.id.replace('Input', '').replace('Select', '')] = select.value;
        });
    }

    // --- Previous Button Listener ---
    prevBtn.addEventListener('click', () => {
        if (currentStep > 0) {
            currentStep--;
            showStep(currentStep);
        }
    });

    // --- Next Button Listener (with validation) ---
    nextBtn.addEventListener('click', () => {
        const currentStepDiv = steps[currentStep];
        const requiredInputs = currentStepDiv.querySelectorAll('[required]');
        let valid = true;

        requiredInputs.forEach(input => {
            // Special handling for radio groups
            if (input.type === "radio") {
                const group = currentStepDiv.querySelectorAll(`input[name="${input.name}"]`);
                const checked = Array.from(group).some(radio => radio.checked);
                if (!checked) {
                    valid = false;
                }
            } else if (input.value.trim() === "") {
                valid = false;
                input.style.borderColor = "red";
            } else {
                input.style.borderColor = "";
            }
        });

        if (!valid) {
            alert("Please answer all required questions before proceeding.");
            return;
        }

        if (currentStep < steps.length - 1) {
            currentStep++;
            showStep(currentStep);
        }
    });

    // --- Agree Button Listener (Final Submission) ---
    agreeBtn.addEventListener('click', async () => {
        mainFormContainer.innerHTML = '<h2>Submitting... Please wait.</h2>';
        
        try {
            const response = await fetch('/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();
            if (data.success) {
                mainFormContainer.style.display = 'none';
                thankYouMessage.style.display = 'block';
                window.scrollTo(0, 0);
            } else {
                alert('An error occurred: ' + data.message);
                mainFormContainer.innerHTML = '<h2>Something went wrong. Please try again later.</h2>';
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to submit application. Please try again.');
            mainFormContainer.innerHTML = '<h2>Something went wrong. Please try again later.</h2>';
        }
    });

    // --- Review Display Function ---
    function displayReviewSummary() {
        collectAllFormData();
        let html = '<div class="review-section"><h3>Personal Details</h3>';
        
        for (const key in formData) {
            if (formData.hasOwnProperty(key)) {
                const label = key.replace(/([A-Z])/g, ' $1').trim().replace(/^(.)/, (match) => match.toUpperCase());
                
                if (key === 'signature' && formData[key]) {
                    html += `<p><strong>${label}:</strong></p>`;
                    html += `<img src="${formData[key]}" alt="Applicant Signature" style="max-width: 100%; border: 1px solid #ccc;"/>`;
                } else {
                    html += `<p><strong>${label}:</strong> ${formData[key] || 'Not provided'}</p>`;
                }
            }
        }
        reviewContent.innerHTML = html;
    }

    // Initialize the form
    showStep(currentStep);
});

class VINDDecoder {
    constructor() {
        this.vinData = vinData;
        
        // Correct mapping: VIN positions (1-24) to input fields
        // This maps logical VIN positions to character positions in the 29-character string
        this.positionToCharMap = {
            1: 1,   // Country -> char 1
            2: 2,   // Assembly Plant -> char 2
            3: 3,   // Model -> char 3
            4: 4,   // Body Type -> char 4
            5: 5,   // Version -> char 5
            6: 6,   // Year -> char 6
            7: 7,   // Month -> char 7
            8: { start: 8, end: 12 }, // Serial Number -> chars 8-12
            9: 13,  // Drive -> char 13
            10: { start: 14, end: 15 }, // Engine -> chars 14-15
            11: 16, // Gearbox -> char 16
            12: 17, // Axle Ratio -> char 17
            13: 18, // Axle Lock -> char 18
            14: 19, // Body Colour 1 -> char 19
            15: 20, // Body Colour 2/Roof -> char 20
            16: 21, // Interior Trim -> char 21
            17: 22, // Radio -> char 22
            18: 23, // Instrument Panel -> char 23
            19: 24, // Windshield -> char 24
            20: 25, // Seats -> char 25
            21: 26, // Suspension -> char 26
            22: 27, // Brakes -> char 27
            23: 28, // Wheels -> char 28
            24: 29  // Rear Window -> char 29
        };
        
        // Mapping from character position to section and field
        this.charToSectionMap = {};
        
        // Build the mapping
        this.buildPositionMappings();
        
        this.currentPosition = null;
        this.currentCode = null;
        
        this.initialize();
        this.updateResults(); // Initialize results on load
    }
    
    buildPositionMappings() {
        // Clear existing mapping
        this.charToSectionMap = {};
        
        // Map each character position to its section and index
        for (let pos = 1; pos <= 29; pos++) {
            if (pos >= 1 && pos <= 12) {
                // Section 1: First 12 characters
                this.charToSectionMap[pos] = { section: 1, index: pos - 1 };
            } else if (pos === 13) {
                // Section 2: Drive
                this.charToSectionMap[pos] = { section: 2, index: 0 };
            } else if (pos >= 14 && pos <= 15) {
                // Section 3: Engine (2 chars)
                this.charToSectionMap[pos] = { section: 3, index: pos - 14 };
            } else if (pos === 16) {
                // Section 4: Transmission
                this.charToSectionMap[pos] = { section: 4, index: 0 };
            } else if (pos >= 17 && pos <= 18) {
                // Section 5: Axle (2 chars)
                this.charToSectionMap[pos] = { section: 5, index: pos - 17 };
            } else if (pos >= 19 && pos <= 20) {
                // Section 6: Colour (2 chars)
                this.charToSectionMap[pos] = { section: 6, index: pos - 19 };
            } else if (pos === 21) {
                // Section 7: Trim
                this.charToSectionMap[pos] = { section: 7, index: 0 };
            } else if (pos >= 22 && pos <= 29) {
                // Section 8: Modification (8 chars)
                this.charToSectionMap[pos] = { section: 8, index: pos - 22 };
            }
        }
    }
    
    initialize() {
        this.bindEvents();
        this.setupAutoFocus();
        this.updateCharCounters();
        this.setupPlaceholders();
        this.setupOptionsModal();
    }
    
    bindEvents() {
        // Remove decode button event listener (button will be removed from HTML)
        // document.getElementById('decodeBtn').addEventListener('click', () => this.decodeFromFields());
        
        // Auto-fill button
        document.getElementById('autoFillBtn').addEventListener('click', () => this.autoFillFields());
        
        // Clear button
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAllFields());
        
        // Full VIN input - Ctrl+V support
        document.getElementById('fullVinInput').addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'v') {
                setTimeout(() => {
                    this.handleFullVINInput();
                }, 10);
            }
        });
        
        // Full VIN input - auto fill fields on paste
        document.getElementById('fullVinInput').addEventListener('paste', (e) => this.handleFullVINPaste(e));
        
        // Full VIN input - decode real-time
        document.getElementById('fullVinInput').addEventListener('input', () => this.handleFullVINInput());
        
        // Full VIN input - decode on Enter key
        document.getElementById('fullVinInput').addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                this.populateFromFullVIN();
            }
        });
        
        // Input events for individual fields - real-time decoding
        document.querySelectorAll('.vin-input').forEach(input => {
            input.addEventListener('input', (e) => {
                this.handleInput(e);
                this.updateResults(); // Real-time update
            });
            input.addEventListener('keyup', (e) => this.handleKeyUp(e));
            input.addEventListener('focus', (e) => this.handleFocus(e));
            input.addEventListener('blur', (e) => this.handleBlur(e));
            
            // Add Ctrl+V support to individual fields
            input.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'v') {
                    setTimeout(() => {
                        this.updateFullVINInput();
                        this.updateResults();
                    }, 10);
                }
            });
        });
        
        // Close modal on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal && this.modal.classList.contains('active')) {
                this.closeOptionsModal();
            }
        });
    }
    
    setupOptionsModal() {
        // Create modal element
        this.modal = document.createElement('div');
        this.modal.className = 'options-modal';
        this.modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="modalTitle">Options</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div id="optionsContainer"></div>
                </div>
                <div class="modal-footer">
                    <div class="code-display">Current code: <span id="currentCodeDisplay">-</span></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.modal);
        
        // Add close event
        this.modal.querySelector('.close-modal').addEventListener('click', () => this.closeOptionsModal());
        
        // Close modal when clicking outside
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeOptionsModal();
            }
        });
    }
    
    showOptionsModal(position, code) {
        this.currentPosition = parseInt(position);
        this.currentCode = code;
        
        // Get position data
        const positionData = this.vinData[this.currentPosition];
        if (!positionData) return;
        
        // Update modal title
        document.getElementById('modalTitle').textContent = `${this.currentPosition}. ${positionData.title}`;
        
        // Update current code display
        document.getElementById('currentCodeDisplay').textContent = code || 'Not set';
        
        // Clear and populate options
        const optionsContainer = document.getElementById('optionsContainer');
        optionsContainer.innerHTML = '';
        
        if (positionData.codes) {
            const optionsList = document.createElement('div');
            optionsList.className = 'options-list';
            
            Object.entries(positionData.codes).forEach(([optCode, description]) => {
                const optionItem = document.createElement('div');
                optionItem.className = 'option-item';
                if (optCode === code) {
                    optionItem.classList.add('current-code');
                }
                
                optionItem.innerHTML = `
                    <span class="option-code">${optCode}</span>
                    <span class="option-desc">${description}</span>
                `;
                
                // Make option clickable to set the code
                optionItem.addEventListener('click', () => {
                    this.setCodeFromModal(optCode);
                });
                
                optionsList.appendChild(optionItem);
            });
            
            optionsContainer.appendChild(optionsList);
        }
        
        // Show modal
        this.modal.classList.add('active');
    }
    
    setCodeFromModal(code) {
        if (!this.currentPosition) return;
        
        // Get character position(s) for this VIN position
        const charPos = this.positionToCharMap[this.currentPosition];
        
        if (typeof charPos === 'object' && charPos.start && charPos.end) {
            // Multi-character position (like Engine or Serial Number)
            for (let pos = charPos.start; pos <= charPos.end; pos++) {
                this.setCharacterAtPosition(pos, code[pos - charPos.start] || '?');
            }
        } else {
            // Single-character position
            this.setCharacterAtPosition(charPos, code);
        }
        
        // Update everything
        this.updateFullVINInput();
        this.updateResults();
        this.closeOptionsModal();
    }
    
    setCharacterAtPosition(charPosition, charValue) {
        // Find which input field and position to update
        const mapping = this.charToSectionMap[charPosition];
        if (!mapping) return;
        
        const { section, index } = mapping;
        const input = document.querySelector(`.vin-section[data-section="${section}"] .vin-input`);
        if (!input) return;
        
        let currentValue = input.value;
        const maxLength = parseInt(input.maxLength);
        
        // Pad with placeholder characters if needed
        if (currentValue.length < maxLength) {
            const placeholder = input.getAttribute('data-placeholder') || '?'.repeat(maxLength);
            currentValue = currentValue + placeholder.substring(currentValue.length, maxLength);
        }
        
        // Update the specific character
        const newValue = currentValue.substring(0, index) + charValue + 
                        currentValue.substring(index + 1);
        
        input.value = newValue;
        this.updateCharCounter(input);
        this.updatePlaceholderDisplay(input);
        
        // Auto-focus next field if this field is now full
        if (newValue.length >= maxLength && maxLength === 1) {
            setTimeout(() => this.focusNextField(input), 100);
        }
    }
    
    closeOptionsModal() {
        this.modal.classList.remove('active');
        this.currentPosition = null;
        this.currentCode = null;
    }
    
    handleFullVINInput() {
        // Real-time update when typing in full VIN field
        setTimeout(() => {
            const fullVinInput = document.getElementById('fullVinInput');
            let vin = fullVinInput.value.toUpperCase();
            
            // Clean the input - remove ONLY spaces, keep dashes
            vin = vin.replace(/\s/g, '');
            
            // Pad with ? to make 29 characters if needed
            if (vin.length < 29) {
                vin = vin + '?'.repeat(29 - vin.length);
            }
            
            // Truncate if too long
            vin = vin.substring(0, 29);
            
            // Populate individual fields
            this.populateFieldsFromVIN(vin);
            
            // Update results
            this.updateResults();
        }, 50); // Small delay for better performance
    }
    
    setupPlaceholders() {
        // Initialize all inputs with placeholder display
        document.querySelectorAll('.vin-input').forEach(input => {
            this.updatePlaceholderDisplay(input);
        });
    }
    
    handleInput(e) {
        const input = e.target;
        
        // Auto-uppercase
        input.value = input.value.toUpperCase();
        
        // Update character counter
        this.updateCharCounter(input);
        
        // Update placeholder display
        this.updatePlaceholderDisplay(input);
        
        // Auto-focus next field when maxlength reached
        if (input.value.length >= parseInt(input.maxLength)) {
            setTimeout(() => this.focusNextField(input), 50);
        }
        
        // Update full VIN display
        this.updateFullVINInput();
    }
    
    handleKeyUp(e) {
        const input = e.target;
        
        if (e.key === 'Tab' || e.key === 'Enter') {
            return; // Let browser handle Tab, we handle Enter elsewhere
        }
        
        if (e.key === 'Backspace' && input.value.length === 0) {
            this.focusPreviousField(input);
        }
    }
    
    handleFocus(e) {
        const input = e.target;
        // When field gets focus, show the placeholder as background
        input.classList.add('has-focus');
        // Select all text for easy editing
        setTimeout(() => input.select(), 10);
    }
    
    handleBlur(e) {
        const input = e.target;
        input.classList.remove('has-focus');
    }
    
    handleFullVINPaste(e) {
        // Get pasted text
        const pastedText = (e.clipboardData || window.clipboardData).getData('text');
        
        // Process after paste is complete
        setTimeout(() => {
            this.populateFromFullVIN();
        }, 10);
    }
    
    populateFromFullVIN() {
        const fullVinInput = document.getElementById('fullVinInput');
        let vin = fullVinInput.value.toUpperCase().trim();
        
        // Clean the input - remove ONLY spaces, keep dashes
        vin = vin.replace(/\s/g, '');
        
        if (vin.length === 0) {
            alert("Please enter a VIN to decode");
            return;
        }
        
        // Pad with ? to make 29 characters if needed
        if (vin.length < 29) {
            vin = vin + '?'.repeat(29 - vin.length);
        }
        
        // Truncate if too long
        vin = vin.substring(0, 29);
        
        // Update the full VIN input with cleaned version
        fullVinInput.value = vin;
        
        // Populate individual fields
        this.populateFieldsFromVIN(vin);
        
        // Update results
        this.updateResults();
    }
    
    populateFieldsFromVIN(vin) {
        // Section 1: First 12 characters (positions 1-8)
        const section1Value = vin.substring(0, 12);
        const section1Input = document.querySelector('.vin-section[data-section="1"] .vin-input');
        if (section1Input) {
            section1Input.value = section1Value;
            this.updateCharCounter(section1Input);
            this.updatePlaceholderDisplay(section1Input);
        }
        
        // Section 2: Character 13 (position 9)
        const section2Value = vin.length >= 13 ? vin[12] : '';
        const section2Input = document.querySelector('.vin-section[data-section="2"] .vin-input');
        if (section2Input) {
            section2Input.value = section2Value;
            this.updateCharCounter(section2Input);
            this.updatePlaceholderDisplay(section2Input);
        }
        
        // Section 3: Characters 14-15 (position 10)
        const section3Value = vin.length >= 15 ? vin.substring(13, 15) : '';
        const section3Input = document.querySelector('.vin-section[data-section="3"] .vin-input');
        if (section3Input) {
            section3Input.value = section3Value;
            this.updateCharCounter(section3Input);
            this.updatePlaceholderDisplay(section3Input);
        }
        
        // Section 4: Character 16 (position 11)
        const section4Value = vin.length >= 16 ? vin[15] : '';
        const section4Input = document.querySelector('.vin-section[data-section="4"] .vin-input');
        if (section4Input) {
            section4Input.value = section4Value;
            this.updateCharCounter(section4Input);
            this.updatePlaceholderDisplay(section4Input);
        }
        
        // Section 5: Characters 17-18 (positions 12-13)
        const section5Value = vin.length >= 18 ? vin.substring(16, 18) : '';
        const section5Input = document.querySelector('.vin-section[data-section="5"] .vin-input');
        if (section5Input) {
            section5Input.value = section5Value;
            this.updateCharCounter(section5Input);
            this.updatePlaceholderDisplay(section5Input);
        }
        
        // Section 6: Characters 19-20 (positions 14-15)
        const section6Value = vin.length >= 20 ? vin.substring(18, 20) : '';
        const section6Input = document.querySelector('.vin-section[data-section="6"] .vin-input');
        if (section6Input) {
            section6Input.value = section6Value;
            this.updateCharCounter(section6Input);
            this.updatePlaceholderDisplay(section6Input);
        }
        
        // Section 7: Character 21 (position 16)
        const section7Value = vin.length >= 21 ? vin[20] : '';
        const section7Input = document.querySelector('.vin-section[data-section="7"] .vin-input');
        if (section7Input) {
            section7Input.value = section7Value;
            this.updateCharCounter(section7Input);
            this.updatePlaceholderDisplay(section7Input);
        }
        
        // Section 8: Characters 22-29 (positions 17-24)
        const section8Value = vin.length >= 29 ? vin.substring(21, 29) : '';
        const section8Input = document.querySelector('.vin-section[data-section="8"] .vin-input');
        if (section8Input) {
            section8Input.value = section8Value;
            this.updateCharCounter(section8Input);
            this.updatePlaceholderDisplay(section8Input);
        }
    }
    
    updateFullVINInput() {
        const combinedVin = this.combineFields();
        document.getElementById('fullVinInput').value = combinedVin;
    }
    
    updatePlaceholderDisplay(input) {
        const placeholder = input.getAttribute('data-placeholder') || '';
        const value = input.value;
        
        if (value.length === 0) {
            // If empty, show full placeholder
            input.setAttribute('placeholder', placeholder);
        } else {
            // Replace placeholder characters with typed values
            let newPlaceholder = '';
            for (let i = 0; i < placeholder.length; i++) {
                if (i < value.length) {
                    // Show typed character
                    newPlaceholder += value[i];
                } else {
                    // Show remaining placeholder
                    newPlaceholder += placeholder[i];
                }
            }
            input.setAttribute('placeholder', newPlaceholder);
        }
    }
    
    updateCharCounter(input) {
        const counter = input.nextElementSibling;
        if (counter && counter.classList.contains('char-counter')) {
            counter.textContent = `${input.value.length}/${input.maxLength}`;
            // Change color based on fill percentage
            const percent = (input.value.length / input.maxLength) * 100;
            if (percent >= 100) {
                counter.style.color = '#27ae60'; // Green when full
                counter.style.fontWeight = 'bold';
            } else if (percent >= 50) {
                counter.style.color = '#f39c12'; // Orange when partially filled
            } else {
                counter.style.color = '#666'; // Gray otherwise
            }
        }
    }
    
    updateCharCounters() {
        document.querySelectorAll('.vin-input').forEach(input => {
            this.updateCharCounter(input);
        });
    }
    
    focusNextField(currentInput) {
        const inputs = Array.from(document.querySelectorAll('.vin-input'));
        const currentIndex = inputs.indexOf(currentInput);
        
        if (currentIndex < inputs.length - 1) {
            inputs[currentIndex + 1].focus();
        }
    }
    
    focusPreviousField(currentInput) {
        const inputs = Array.from(document.querySelectorAll('.vin-input'));
        const currentIndex = inputs.indexOf(currentInput);
        
        if (currentIndex > 0) {
            inputs[currentIndex - 1].focus();
        }
    }
    
    setupAutoFocus() {
        // Focus first input on page load
        const firstInput = document.querySelector('.vin-input');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
    
    combineFields() {
        // Total VIN is 29 characters (based on your Python code)
        let positions = new Array(29).fill('?');
        
        // Map section inputs to positions
        document.querySelectorAll('.vin-section').forEach(sectionEl => {
            const section = parseInt(sectionEl.dataset.section);
            if (section >= 1 && section <= 8) {
                const input = sectionEl.querySelector('.vin-input');
                const value = input ? input.value.toUpperCase() : '';
                
                if (section === 1) {
                    // Special handling for section 1: 12 chars for positions 1-8
                    if (value.length >= 12) {
                        positions[0] = value[0] || '?';
                        positions[1] = value[1] || '?';
                        positions[2] = value[2] || '?';
                        positions[3] = value[3] || '?';
                        positions[4] = value[4] || '?';
                        positions[5] = value[5] || '?';
                        positions[6] = value[6] || '?';
                        positions[7] = value[7] || '?';
                        positions[8] = value[8] || '?';
                        positions[9] = value[9] || '?';
                        positions[10] = value[10] || '?';
                        positions[11] = value[11] || '?';
                    } else if (value.length > 0) {
                        // Distribute what we have
                        for (let i = 0; i < Math.min(value.length, 12); i++) {
                            positions[i] = value[i] || '?';
                        }
                    }
                } else if (section === 2) {
                    // Section 2: Drive (char 13)
                    if (value.length > 0) {
                        positions[12] = value[0] || '?';
                    }
                } else if (section === 3) {
                    // Section 3: Engine (chars 14-15)
                    if (value.length > 0) {
                        positions[13] = value[0] || '?';
                        if (value.length > 1) {
                            positions[14] = value[1] || '?';
                        }
                    }
                } else if (section === 4) {
                    // Section 4: Transmission (char 16)
                    if (value.length > 0) {
                        positions[15] = value[0] || '?';
                    }
                } else if (section === 5) {
                    // Section 5: Axle (chars 17-18)
                    if (value.length > 0) {
                        positions[16] = value[0] || '?';
                        if (value.length > 1) {
                            positions[17] = value[1] || '?';
                        }
                    }
                } else if (section === 6) {
                    // Section 6: Colour (chars 19-20)
                    if (value.length > 0) {
                        positions[18] = value[0] || '?';
                        if (value.length > 1) {
                            positions[19] = value[1] || '?';
                        }
                    }
                } else if (section === 7) {
                    // Section 7: Trim (char 21)
                    if (value.length > 0) {
                        positions[20] = value[0] || '?';
                    }
                } else if (section === 8) {
                    // Section 8: Modification (chars 22-29)
                    for (let i = 0; i < Math.min(value.length, 8); i++) {
                        positions[21 + i] = value[i] || '?';
                    }
                }
            }
        });
        
        return positions.join('');
    }
    
    updateResults() {
        const combinedVin = this.combineFields();
        
        // Always display full VIN
        document.getElementById('fullVinDisplay').textContent = `VIN: ${combinedVin}`;
        
        // Always decode and display results
        const results = this.decodeSingleVIN(combinedVin);
        document.getElementById('resultsText').innerHTML = results;
        
        // Update status
        const filledPositions = combinedVin.replace(/[?]/g, '').length;
        const totalPositions = 29;
        document.getElementById('filledPositions').textContent = filledPositions;
        document.getElementById('totalPositions').textContent = totalPositions;
        
        // Update status bar
        document.getElementById('statusBar').innerHTML = 
            `<i class="fas fa-info-circle"></i> ${filledPositions > 0 ? `Decoded ${filledPositions} of ${totalPositions} characters` : 'Ready - Start typing to decode'}`;
    }
    
    decodeFromFields() {
        this.updateResults();
    }
    
    decodeSingleVIN(vinString) {
        let vinCharPosition = 1;
        let logicalPosition = 1;
        
        const decodedData = [];
        
        while (logicalPosition <= 24 && vinCharPosition <= vinString.length) {
            const charsNeeded = this.getCharsNeededForLogicalPosition(logicalPosition);
            const code = vinString.substring(vinCharPosition - 1, vinCharPosition - 1 + charsNeeded);
            
            let result = '?';
            if (!code.includes('?') && logicalPosition !== 8) {
                result = this.lookupCode(logicalPosition, code);
            } else if (!code.includes('?') && logicalPosition === 8) {
                result = code;  // Position 8 returns as-is (serial number)
            }
            
            decodedData.push({
                position: logicalPosition,
                code: code.replace(/\?/g, '') || '?',
                result,
                title: this.getPositionTitle(logicalPosition)
            });
            
            vinCharPosition += charsNeeded;
            logicalPosition++;
        }
        
        // Build compact HTML output
        let results = '<div class="compact-results">';
        
        // Create a grid layout for compact display
        results += '<div class="results-grid">';
        
        // Vehicle Identification (Positions 1-8)
        results += '<div class="result-category compact">';
        results += '<h3 class="compact-title">VEHICLE</h3>';
        results += '<div class="results-list">';
        for (let i = 0; i < 8; i++) {
            const data = decodedData[i];
            if (data) {
                const title = this.formatTitleCompact(data.title);
                const resultClass = data.result === '?' ? 'unknown' : 'known';
                const displayResult = data.result === '?' ? '?' : data.result;
                const clickable = data.position !== 8 ? 'clickable' : ''; // Don't make serial number clickable
                
                results += `<div class="result-item-compact ${resultClass} ${clickable}" data-position="${data.position}" data-code="${data.code}">
                    <span class="result-title">${title}</span>
                    <span class="result-value">${displayResult}</span>
                </div>`;
            }
        }
        results += '</div></div>';
        
        // Drivetrain (Positions 9-13)
        results += '<div class="result-category compact">';
        results += '<h3 class="compact-title">DRIVETRAIN</h3>';
        results += '<div class="results-list">';
        for (let i = 8; i < 13; i++) {
            const data = decodedData[i];
            if (data) {
                const title = this.formatTitleCompact(data.title);
                const resultClass = data.result === '?' ? 'unknown' : 'known';
                const displayResult = data.result === '?' ? '?' : data.result;
                results += `<div class="result-item-compact ${resultClass} clickable" data-position="${data.position}" data-code="${data.code}">
                    <span class="result-title">${title}</span>
                    <span class="result-value">${displayResult}</span>
                </div>`;
            }
        }
        results += '</div></div>';
        
        // Exterior & Interior (Positions 14-16)
        results += '<div class="result-category compact">';
        results += '<h3 class="compact-title">APPEARANCE</h3>';
        results += '<div class="results-list">';
        for (let i = 13; i < 16; i++) {
            const data = decodedData[i];
            if (data) {
                const title = this.formatTitleCompact(data.title);
                const resultClass = data.result === '?' ? 'unknown' : 'known';
                const displayResult = data.result === '?' ? '?' : data.result;
                results += `<div class="result-item-compact ${resultClass} clickable" data-position="${data.position}" data-code="${data.code}">
                    <span class="result-title">${title}</span>
                    <span class="result-value">${displayResult}</span>
                </div>`;
            }
        }
        results += '</div></div>';
        
        // Features (Positions 17-24)
        results += '<div class="result-category compact">';
        results += '<h3 class="compact-title">FEATURES</h3>';
        results += '<div class="results-list">';
        for (let i = 16; i < 24; i++) {
            const data = decodedData[i];
            if (data) {
                const title = this.formatTitleCompact(data.title);
                const resultClass = data.result === '?' ? 'unknown' : 'known';
                const displayResult = data.result === '?' ? '?' : data.result;
                results += `<div class="result-item-compact ${resultClass} clickable" data-position="${data.position}" data-code="${data.code}">
                    <span class="result-title">${title}</span>
                    <span class="result-value">${displayResult}</span>
                </div>`;
            }
        }
        results += '</div></div>';
        
        results += '</div>'; // Close results-grid
        
        // Add compact summary
        const knownCount = decodedData.filter(d => d.result !== '?').length;
        const unknownCount = decodedData.filter(d => d.result === '?').length;
        
        results += `<div class="compact-summary">
            <div class="summary-item">
                <span class="summary-label">Known:</span>
                <span class="summary-value known">${knownCount}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Unknown:</span>
                <span class="summary-value unknown">${unknownCount}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Total:</span>
                <span class="summary-value">${logicalPosition-1}/24</span>
            </div>
        </div>`;
        
        results += '</div>'; // Close compact-results
        
        // Add click event listeners to result items
        setTimeout(() => {
            document.querySelectorAll('.result-item-compact.clickable').forEach(item => {
                item.addEventListener('click', (e) => {
                    const position = item.getAttribute('data-position');
                    const code = item.getAttribute('data-code');
                    this.showOptionsModal(position, code);
                });
            });
        }, 0);
        
        return results;
    }
    
    formatTitleCompact(title) {
        // Make titles more compact for display
        const titleMap = {
            'COUNTRY': 'Country',
            'ASSEMBLY PLANT': 'Plant',
            'MODEL': 'Model',
            'BODY TYPE': 'Body',
            'VERSION': 'Version',
            'YEAR': 'Year',
            'MONTH': 'Month',
            'SERIAL NUMBER': 'Serial',
            'DRIVE': 'Drive',
            'ENGINE': 'Engine',
            'GEARBOX': 'Trans',
            'AXLE RATIO': 'Axle Ratio',
            'AXLE LOCK': 'Axle Lock',
            'BODY COLOUR': 'Color',
            'VINYL ROOF': 'Roof',
            'INTERIOR TRIM': 'Interior',
            'RADIO': 'Radio',
            'INSTRUMENT PANEL': 'Instruments',
            'WINDSHIELD': 'Windshield',
            'SEATS': 'Seats',
            'SUSPENSION': 'Suspension',
            'BRAKES': 'Brakes',
            'WHEELS': 'Wheels',
            'REAR WINDOW': 'Rear Window'
        };
        
        return titleMap[title] || title.replace(/_/g, ' ').substring(0, 12);
    }
    
    getCharsNeededForLogicalPosition(logicalPosition) {
        // Based on the VIN structure
        if (logicalPosition === 8) return 5;  // Serial number (5 chars)
        if (logicalPosition === 10) return 2; // Engine code (2 chars)
        return 1;  // All other positions (1 char)
    }
    
    lookupCode(position, code) {
        if (position === 8) return code; // Serial number - return as-is
        
        const posData = this.vinData[position];
        if (posData && posData.codes && posData.codes[code]) {
            return posData.codes[code];
        }
        
        return `?`;
    }
    
    getPositionTitle(position) {
        const posData = this.vinData[position];
        return posData ? posData.title : `Position ${position}`;
    }
    
    autoFillFields() {
        const examples = {
            "1": "UBBBDML46554",
            "2": "1",
            "3": "NA",
            "4": "B",
            "5": "BA",
            "6": "A-",
            "7": "N",
            "8": "J-184-A-"
        };
        
        Object.entries(examples).forEach(([section, value]) => {
            const input = document.querySelector(`.vin-section[data-section="${section}"] .vin-input`);
            if (input) {
                input.value = value;
                this.updateCharCounter(input);
                this.updatePlaceholderDisplay(input);
            }
        });
        
        // Update full VIN input
        this.updateFullVINInput();
        
        // Update results
        this.updateResults();
    }
    
    clearAllFields() {
        document.querySelectorAll('.vin-input').forEach(input => {
            input.value = '';
            this.updateCharCounter(input);
            this.updatePlaceholderDisplay(input);
        });
        
        // Clear full VIN input
        document.getElementById('fullVinInput').value = '';
        
        // Update results (will show empty state)
        this.updateResults();
        
        // Focus first input
        const firstInput = document.querySelector('.vin-input');
        if (firstInput) firstInput.focus();
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const decoder = new VINDDecoder();
});
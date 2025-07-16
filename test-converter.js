const fs = require('fs');
const { convertWidget } = require('./assets/chat/converter.js');

/**
 * Test the enhanced AI converter with complex V3 to V4 conversions
 */
async function testConverter() {
    console.log('🧪 Testing Enhanced AI Converter for Complex V3 to V4 Conversions\n');
    
    try {
        // Test 1: Convert complex V3 example to V4
        console.log('📋 Test 1: Converting complex V3 container to V4 format...');
        
        // Create a test user input file with complex V3 data
        const complexV3 = JSON.parse(fs.readFileSync('./assets/chat/complexV3.json', 'utf-8'));
        fs.writeFileSync('./assets/chat/container-user.json', JSON.stringify(complexV3, null, 2));
        
        const result = await convertWidget({
            logRawResponse: true
        });
        
        console.log('✅ Conversion successful!');
        console.log('📊 Result structure:');
        console.log(`   - Type: ${result.type}`);
        console.log(`   - Version: ${result.version}`);
        console.log(`   - Content elements: ${result.content?.length || 0}`);
        
        if (result.content && result.content.length > 0) {
            console.log('📝 Content structure:');
            result.content.forEach((element, index) => {
                console.log(`   ${index + 1}. ${element.widgetType || element.elType} (ID: ${element.id})`);
                if (element.elements && element.elements.length > 0) {
                    element.elements.forEach((child, childIndex) => {
                        console.log(`      ${childIndex + 1}. ${child.widgetType || child.elType} (ID: ${child.id})`);
                    });
                }
            });
        }
        
        // Validate the result structure
        console.log('\n🔍 Validating conversion result...');
        validateV4Structure(result);
        console.log('✅ Validation passed!');
        
        // Save the result for comparison
        fs.writeFileSync('./assets/chat/test-result.json', JSON.stringify(result, null, 2));
        console.log('💾 Result saved to test-result.json');
        
        // Test 2: Test with different widget types
        console.log('\n📋 Test 2: Testing individual widget conversions...');
        
        const simpleTests = [
            {
                name: 'Heading Widget',
                data: {
                    "content": [{
                        "id": "test-heading",
                        "settings": {
                            "title": "Test Heading",
                            "typography_font_family": "Arial",
                            "typography_font_size": {"unit": "px", "size": 24},
                            "title_color": "#000000",
                            "align": "center",
                            "link": {"url": "https://example.com", "is_external": "", "nofollow": ""}
                        },
                        "elements": [],
                        "isInner": false,
                        "widgetType": "heading",
                        "elType": "widget"
                    }],
                    "version": "0.4",
                    "type": "container"
                }
            },
            {
                name: 'Button Widget',
                data: {
                    "content": [{
                        "id": "test-button",
                        "settings": {
                            "text": "Click Me",
                            "background_color": "#007cba",
                            "color": "#ffffff",
                            "width": {"unit": "px", "size": 200},
                            "height": {"unit": "px", "size": 50},
                            "link": {"url": "https://example.com", "is_external": "", "nofollow": ""}
                        },
                        "elements": [],
                        "isInner": false,
                        "widgetType": "button",
                        "elType": "widget"
                    }],
                    "version": "0.4",
                    "type": "container"
                }
            }
        ];
        
        for (const test of simpleTests) {
            console.log(`   Testing ${test.name}...`);
            
            // Write test data
            fs.writeFileSync('./assets/chat/container-user.json', JSON.stringify(test.data, null, 2));
            
            try {
                const testResult = await convertWidget();
                
                // Basic validation
                if (testResult.content && testResult.content.length > 0) {
                    const element = testResult.content[0];
                    console.log(`   ✅ ${test.name} converted successfully`);
                    console.log(`      - Widget type: ${element.widgetType}`);
                    console.log(`      - Has settings: ${!!element.settings}`);
                    console.log(`      - Has styles: ${!!element.styles && Object.keys(element.styles).length > 0}`);
                } else {
                    console.log(`   ❌ ${test.name} conversion failed - no content`);
                }
                
            } catch (error) {
                console.log(`   ❌ ${test.name} conversion failed: ${error.message}`);
            }
        }
        
        console.log('\n🎉 All tests completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

/**
 * Validate V4 structure requirements
 */
function validateV4Structure(result) {
    // Check root structure
    if (!result.content || !Array.isArray(result.content)) {
        throw new Error('Result must have content array');
    }
    
    if (!result.version || !result.type) {
        throw new Error('Result must have version and type');
    }
    
    // Validate each content element
    result.content.forEach((element, index) => {
        validateElement(element, `content[${index}]`);
    });
}

/**
 * Validate individual element structure
 */
function validateElement(element, path) {
    // Required fields
    const requiredFields = ['id', 'settings', 'elements', 'isInner', 'elType'];
    
    for (const field of requiredFields) {
        if (!(field in element)) {
            throw new Error(`${path} missing required field: ${field}`);
        }
    }
    
    // Widget-specific validation
    if (element.elType === 'widget' && !element.widgetType) {
        throw new Error(`${path} widget missing widgetType`);
    }
    
    // Validate widget type has "e-" prefix
    if (element.widgetType && !element.widgetType.startsWith('e-')) {
        throw new Error(`${path} widget type should start with "e-": ${element.widgetType}`);
    }
    
    // Validate settings structure
    if (element.settings && typeof element.settings === 'object') {
        validateSettings(element.settings, `${path}.settings`);
    }
    
    // Validate styles structure
    if (element.styles && typeof element.styles === 'object') {
        validateStyles(element.styles, `${path}.styles`);
    }
    
    // Recursively validate child elements
    if (element.elements && Array.isArray(element.elements)) {
        element.elements.forEach((child, childIndex) => {
            validateElement(child, `${path}.elements[${childIndex}]`);
        });
    }
}

/**
 * Validate settings structure with type annotations
 */
function validateSettings(settings, path) {
    for (const [key, value] of Object.entries(settings)) {
        if (typeof value === 'object' && value !== null && value.$$type) {
            validateTypeStructure(value, `${path}.${key}`);
        }
    }
}

/**
 * Validate styles structure
 */
function validateStyles(styles, path) {
    for (const [className, styleData] of Object.entries(styles)) {
        if (!styleData.id || !styleData.label || !styleData.type || !styleData.variants) {
            throw new Error(`${path}.${className} missing required style fields`);
        }
        
        if (!Array.isArray(styleData.variants)) {
            throw new Error(`${path}.${className} variants must be array`);
        }
        
        styleData.variants.forEach((variant, variantIndex) => {
            if (!variant.meta || !variant.props) {
                throw new Error(`${path}.${className}.variants[${variantIndex}] missing meta or props`);
            }
            
            // Validate props have proper type structures
            for (const [propName, propValue] of Object.entries(variant.props)) {
                if (typeof propValue === 'object' && propValue !== null && propValue.$$type) {
                    validateTypeStructure(propValue, `${path}.${className}.variants[${variantIndex}].props.${propName}`);
                }
            }
        });
    }
}

/**
 * Validate type structure
 */
function validateTypeStructure(data, path) {
    if (!data.$$type || !('value' in data)) {
        throw new Error(`${path} missing $$type or value`);
    }
    
    // Type-specific validation
    switch (data.$$type) {
        case 'string':
            if (typeof data.value !== 'string') {
                throw new Error(`${path} string type must have string value`);
            }
            break;
            
        case 'size':
            if (!data.value.unit || typeof data.value.size !== 'number') {
                throw new Error(`${path} size type must have unit and size`);
            }
            break;
            
        case 'color':
            if (typeof data.value !== 'string' || !/^#[0-9a-fA-F]{6}$/i.test(data.value)) {
                throw new Error(`${path} color type must be valid hex color`);
            }
            break;
            
        case 'classes':
            if (!Array.isArray(data.value)) {
                throw new Error(`${path} classes type must have array value`);
            }
            break;
            
        case 'link':
            if (!data.value.destination || !data.value.label) {
                throw new Error(`${path} link type must have destination and label`);
            }
            break;
    }
}

// Run the tests
if (require.main === module) {
    testConverter().catch(console.error);
}

module.exports = { testConverter, validateV4Structure }; 
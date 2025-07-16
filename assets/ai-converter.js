

jQuery( window ).on( 'elementor:init', function() {

    const AIConverterAPI = {

        async convertContainer( containerData ) {
            return new Promise( ( resolve, reject ) => {
                jQuery.ajax({
                    url: aiConverter.ajaxUrl,
                    type: 'POST',
                    data: {
                        action: 'ai_converter_convert',
                        nonce: aiConverter.nonce,
                        container_data: JSON.stringify( containerData )
                    },
                    timeout: 30000,
                    success: function( response ) {
                        if ( response.success ) {
                            resolve( response.data );
                        } else {
                            reject( new Error( response.data || 'Unknown error' ) );
                        }
                    },
                    error: function( xhr, status, error ) {
                        reject( new Error( `AI conversion failed: ${error}` ) );
                    }
                });
            });
        }
    };

    const ContainerService = {
        extractContainerData( view ) {
            const data = {
                id: view.model.get('id'),
                elType: view.model.get('elType'),
                settings: view.model.get('settings')?.toJSON({ remove: 'default' }) || {},
                elements: [],
                isInner: view.model.get('isInner') || false
            };

            // Recursively extract data from child elements
            const children = view.model.get('elements');
            if ( children && children.length > 0 ) {
                data.elements = children.map( child => this.extractElementData( child ) );
            }

            return data;
        },

        extractElementData( elementModel ) {
            const data = {
                id: elementModel.get('id'),
                elType: elementModel.get('elType'),
                settings: elementModel.get('settings')?.toJSON({ remove: 'default' }) || {},
                elements: [],
                isInner: elementModel.get('isInner') || false
            };

            // Recursively extract data from child elements
            const children = elementModel.get('elements');
            if ( children && children.length > 0 ) {
                data.elements = children.map( child => this.extractElementData( child ) );
            }

            return data;
        },

        createV4Element( v4Response, parentContainer, index = 0 ) {
            // Handle different response types
            if ( v4Response.error ) {
                throw new Error( 'OpenAI returned an error: ' + v4Response.error );
            }

            console.log('🔨 Creating V4 element:', {
                id: v4Response.id,
                elType: v4Response.elType,
                widgetType: v4Response.widgetType,
                hasChildren: v4Response.elements && v4Response.elements.length > 0,
                childCount: v4Response.elements ? v4Response.elements.length : 0
            });

            let createdElement;

            // For V4 flexbox elements, create the actual V4 element
            if ( v4Response.elType === 'e-flexbox' ) {
                try {
                    // Try to create the V4 element with the full structure
                    createdElement = $e.run( 'document/elements/create', {
                        model: {
                            id: v4Response.id,
                            elType: 'e-flexbox',
                            settings: v4Response.settings || {},
                            elements: [], // We'll add children recursively
                            isInner: v4Response.isInner || false,
                            styles: v4Response.styles || {},
                            editor_settings: v4Response.editor_settings || [],
                            version: v4Response.version || "0.0"
                        },
                        container: parentContainer,
                        options: {
                            at: index,
                            edit: false,
                        },
                    });
                } catch ( error ) {
                    console.warn( 'Failed to create V4 flexbox with full structure:', error );
                    
                    // Fallback: create with simplified settings
                    const simplifiedSettings = {
                        classes: v4Response.settings?.classes || {"$$type": "classes", "value": []},
                    };

                    // Try creating as V4 flexbox with simplified settings
                    createdElement = $e.run( 'document/elements/create', {
                        model: {
                            elType: 'e-flexbox',
                            settings: simplifiedSettings
                        },
                        container: parentContainer,
                        options: {
                            at: index,
                            edit: false,
                        },
                    });
                }
            } else if ( v4Response.elType === 'widget' ) {
                // Handle widget elements
                try {
                    createdElement = $e.run( 'document/elements/create', {
                        model: {
                            id: v4Response.id,
                            elType: 'widget',
                            widgetType: v4Response.widgetType,
                            settings: v4Response.settings || {},
                            elements: [], // Widgets don't have children
                            isInner: v4Response.isInner || false,
                            styles: v4Response.styles || {},
                            editor_settings: v4Response.editor_settings || [],
                            version: v4Response.version || "0.0"
                        },
                        container: parentContainer,
                        options: {
                            at: index,
                            edit: false,
                        },
                    });
                } catch ( error ) {
                    console.warn( 'Failed to create widget element:', error );
                    
                    // Fallback: create with basic settings
                    createdElement = $e.run( 'document/elements/create', {
                        model: {
                            elType: 'widget',
                            widgetType: v4Response.widgetType,
                            settings: v4Response.settings || {}
                        },
                        container: parentContainer,
                        options: {
                            at: index,
                            edit: false,
                        },
                    });
                }
            } else {
                // Handle regular container format (fallback)
                createdElement = $e.run( 'document/elements/create', {
                    model: {
                        elType: v4Response.elType || 'container',
                        settings: v4Response.settings || {}
                    },
                    container: parentContainer,
                    options: {
                        at: index,
                        edit: false,
                    },
                });
            }

            // Recursively create child elements
            if ( v4Response.elements && v4Response.elements.length > 0 ) {
                console.log(`🔄 Creating ${v4Response.elements.length} child elements for ${v4Response.id}`);
                
                v4Response.elements.forEach( ( childElement, childIndex ) => {
                    try {
                        console.log(`   Creating child ${childIndex + 1}/${v4Response.elements.length}:`, childElement.widgetType || childElement.elType);
                        const childResult = this.createV4Element( childElement, createdElement, childIndex );
                        console.log(`   ✅ Child ${childIndex + 1} created successfully`);
                    } catch ( childError ) {
                        console.error( `❌ Failed to create child element at index ${childIndex}:`, childError );
                        console.error( 'Child element data:', childElement );
                    }
                });
            } else {
                console.log(`ℹ️  No child elements to create for ${v4Response.id}`);
            }

            return createdElement;
        }
    };

    const NotificationService = {
        success( message ) {
            elementor.notifications.showToast({
                message: message,
                type: 'success'
            });
        },

        error( message ) {
            elementor.notifications.showToast({
                message: message,
                type: 'error'
            });
        },

        loading( message ) {
            elementor.notifications.showToast({
                message: message,
                type: 'info'
            });
        }
    };

    const ConversionHandler = {
        async handleConversion( view ) {
            try {
                NotificationService.loading( 'Converting container with AI...' );

                const containerData = ContainerService.extractContainerData( view );
                
                // Debug: Log the input data
                console.log('🔍 Input container data:', containerData);
                
                const v4Response = await AIConverterAPI.convertContainer( containerData );
                
                // Debug: Log the conversion result
                console.log('🔍 AI conversion result:', v4Response);
                
                // Validate conversion result
                if ( !v4Response || typeof v4Response !== 'object' ) {
                    throw new Error( 'Invalid conversion result from AI' );
                }
                
                // Check if nested elements were preserved
                if ( containerData.elements && containerData.elements.length > 0 ) {
                    if ( !v4Response.elements || v4Response.elements.length === 0 ) {
                        console.warn('⚠️  Warning: Input had child elements but conversion result has no children');
                        console.warn('Input elements:', containerData.elements);
                        console.warn('Output elements:', v4Response.elements);
                    } else {
                        console.log('✅ Child elements preserved:', {
                            input: containerData.elements.length,
                            output: v4Response.elements.length
                        });
                    }
                }

                // Get parent container for positioning
                const rootContainer = view.container.parent || elementor.getPreviewContainer();

                // Create the V4 element
                const createdElement = ContainerService.createV4Element( v4Response, rootContainer, 1 );
                
                // Debug: Log creation result
                console.log('✅ Element created successfully:', createdElement);

                // Show success notification
                NotificationService.success( 'Container converted to V4 successfully!' );

            } catch ( error ) {
                console.error('❌ Conversion error:', error);
                console.error('Error stack:', error.stack);
                NotificationService.error( 'Failed to convert container: ' + error.message );
            }
        }
    };

    elementor.hooks.addFilter( 'elements/container/contextMenuGroups', function( groups, view ) {
        const converterGroup = {
            name: 'ai-converter-container',
            actions: [
                                 {
                     name: 'convert_to_v4',
                     title: 'Convert to V4',
                     icon: 'eicon-ai',
                     callback: function() {
                         // Try to close the context menu through behavior
                         if ( view._behaviors && view._behaviors.contextMenu && view._behaviors.contextMenu.contextMenu ) {
                             view._behaviors.contextMenu.contextMenu.getModal().hide();
                         }

                         setTimeout( function() {
                             ConversionHandler.handleConversion( view );
                         }, 100 );
                     }
                 }
            ]
        };

        groups.push( converterGroup );
        return groups;
    });
} );


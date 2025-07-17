

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

    const SatisfactionService = {
        addSatisfactionButtons( newElement, originalContainer, originalView ) {
            if ( ! newElement || ! newElement.view || ! newElement.view.$el ) {
                return;
            }

            const elementId = newElement.id;
            const $elementContainer = newElement.view.$el;

            // Check if buttons already exist
            if ( $elementContainer.find( '.ai-converter-satisfaction' ).length > 0 ) {
                return;
            }

            // Create satisfaction buttons with Material UI styling
            const $satisfactionContainer = jQuery( `
                <div class="ai-converter-satisfaction" data-element-id="${elementId}" style="
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: #ffffff;
                    border: none;
                    border-radius: 8px;
                    padding: 0;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.12);
                    z-index: 9999;
                    font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                    color: #333;
                    min-width: 280px;
                    max-width: 320px;
                    overflow: hidden;
                ">
                    <div style="
                        padding: 16px 20px 8px 20px;
                        border-bottom: 1px solid #f0f0f0;
                    ">
                        <h3 style="
                            margin: 0 0 4px 0;
                            font-size: 16px;
                            font-weight: 500;
                            color: #1a1a1a;
                            line-height: 1.3;
                        ">AI Conversion</h3>
                        <p style="
                            margin: 0;
                            font-size: 14px;
                            color: #666;
                            line-height: 1.4;
                        ">How would you like to proceed with this conversion?</p>
                    </div>
                    <div style="
                        padding: 12px 16px 16px 16px;
                        display: flex;
                        gap: 8px;
                        justify-content: flex-end;
                    ">
                        <button class="satisfaction-btn satisfaction-reject" data-action="reject" title="Reject conversion - remove new element" style="
                            background: transparent;
                            color: #666;
                            border: 1px solid #ddd;
                            border-radius: 4px;
                            padding: 8px 16px;
                            cursor: pointer;
                            font-family: inherit;
                            font-size: 14px;
                            font-weight: 500;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                            transition: all 0.2s ease;
                            min-width: 64px;
                            height: 36px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        " onmouseover="this.style.background='#f5f5f5'; this.style.borderColor='#999';" onmouseout="this.style.background='transparent'; this.style.borderColor='#ddd';">REJECT</button>
                        <button class="satisfaction-btn satisfaction-regenerate" data-action="regenerate" title="Try again - regenerate conversion" style="
                            background: transparent;
                            color: #666;
                            border: 1px solid #ddd;
                            border-radius: 4px;
                            padding: 8px 16px;
                            cursor: pointer;
                            font-family: inherit;
                            font-size: 14px;
                            font-weight: 500;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                            transition: all 0.2s ease;
                            min-width: 64px;
                            height: 36px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        " onmouseover="this.style.background='#f5f5f5'; this.style.borderColor='#999';" onmouseout="this.style.background='transparent'; this.style.borderColor='#ddd';">RETRY</button>
                        <button class="satisfaction-btn satisfaction-accept" data-action="accept" title="Accept conversion - remove original" style="
                            background: #F3BAFD;
                            color: white;
                            border: 1px solid #9c27b0;
                            border-radius: 4px;
                            padding: 8px 16px;
                            cursor: pointer;
                            font-family: inherit;
                            font-size: 14px;
                            font-weight: 500;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                            transition: all 0.2s ease;
                            min-width: 64px;
                            height: 36px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        " onmouseover="this.style.background='#7b1fa2';" onmouseout="this.style.background='#F3BAFD';">ACCEPT</button>
                    </div>
                </div>
            ` );

            // Add click handlers
            $satisfactionContainer.find( '.satisfaction-btn' ).on( 'click', async function( e ) {
                e.preventDefault();
                e.stopPropagation();

                const action = jQuery( this ).data( 'action' );
                
                if ( action === 'accept' ) {
                    // Accept the conversion - remove original element
                    SatisfactionService.logSatisfactionFeedback( elementId, 'satisfied' );
                    
                    if ( originalContainer ) {
                        try {
                            // Remove the original element using Elementor's command system
                            $e.run( 'document/elements/delete', {
                                container: originalContainer
                            });
                            
                            NotificationService.success( 'Original element removed. Conversion completed!' );
                        } catch ( error ) {
                            console.error( 'Failed to remove original element:', error );
                            NotificationService.error( 'Could not remove original element' );
                        }
                    }
                    
                    // Hide the satisfaction buttons after feedback
                    $satisfactionContainer.fadeOut( 300, function() {
                        jQuery( this ).remove();
                    } );
                    
                } else if ( action === 'regenerate' ) {
                    // Regenerate - delete current and create new
                    SatisfactionService.logSatisfactionFeedback( elementId, 'regenerate' );
                    
                    // Remove the satisfaction buttons
                    $satisfactionContainer.fadeOut( 300, function() {
                        jQuery( this ).remove();
                    } );
                    
                    // Delete current V4 element first
                    try {
                        $e.run( 'document/elements/delete', {
                            container: newElement
                        });
                    } catch ( error ) {
                        console.error( 'Failed to remove current V4 element:', error );
                    }
                    
                    // Regenerate the conversion
                    NotificationService.loading( 'Regenerating conversion...' );
                    try {
                        await ConversionHandler.handleConversion( originalView );
                    } catch ( error ) {
                        console.error( 'Failed to regenerate conversion:', error );
                        NotificationService.error( 'Failed to regenerate conversion: ' + error.message );
                    }
                    
                } else if ( action === 'reject' ) {
                    // Reject - delete the new V4 element, keep original
                    SatisfactionService.logSatisfactionFeedback( elementId, 'not_satisfied' );
                    
                    try {
                        $e.run( 'document/elements/delete', {
                            container: newElement
                        });
                        
                        NotificationService.success( 'V4 element removed. Original element preserved.' );
                    } catch ( error ) {
                        console.error( 'Failed to remove V4 element:', error );
                        NotificationService.error( 'Could not remove V4 element' );
                    }
                    
                    // Remove the satisfaction buttons
                    $satisfactionContainer.fadeOut( 300, function() {
                        jQuery( this ).remove();
                    } );
                }
            } );

            // Position and show the buttons
            $elementContainer.css( 'position', 'relative' );
            $elementContainer.append( $satisfactionContainer );
            
            // Auto-hide after 15 seconds if no interaction
            setTimeout( function() {
                if ( $satisfactionContainer.is( ':visible' ) ) {
                    $satisfactionContainer.fadeOut( 300, function() {
                        jQuery( this ).remove();
                    } );
                }
            }, 15000 );
        },



        logSatisfactionFeedback( elementId, feedback ) {
            const feedbackData = {
                timestamp: new Date().toISOString(),
                elementId: elementId,
                feedback: feedback,
                satisfied: feedback === 'satisfied',
                source: 'ai-converter'
            };

            console.log( '=== AI Converter Satisfaction Feedback ===', feedbackData );
            
            // Optional: Send to analytics or your API
            // this.sendFeedbackToAPI( feedbackData );
        },

        sendFeedbackToAPI( feedbackData ) {
            // Optional implementation for sending feedback to your API
            jQuery.ajax({
                url: aiConverter.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'ai_converter_feedback',
                    nonce: aiConverter.nonce,
                    feedback_data: JSON.stringify( feedbackData )
                },
                success: function( response ) {
                    console.log( 'Feedback sent successfully', response );
                },
                error: function( error ) {
                    console.log( 'Failed to send feedback', error );
                }
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

                const newElement = ContainerService.createV4Element( v4Response, rootContainer, 1 );

                // Show success notification
                NotificationService.success( 'Container converted to V4 successfully!' );

                // Add satisfaction buttons with reference to original container and view
                setTimeout( function() {
                    SatisfactionService.addSatisfactionButtons( newElement, view.container, view );
                }, 500 );

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


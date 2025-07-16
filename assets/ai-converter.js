

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
            return {
                id: view.model.get('id'),
                elType: view.model.get('elType'),
                settings: view.model.get('settings')?.toJSON({ remove: 'default' }) || {},
                elements: view.model.get('elements') || [],
                isInner: view.model.get('isInner') || false
            };
        },

        createV4Element( v4Response, parentContainer, index = 0 ) {
            // Handle different response types
            if ( v4Response.error ) {
                throw new Error( 'OpenAI returned an error: ' + v4Response.error );
            }

            // For V4 flexbox elements, create the actual V4 element
            if ( v4Response.elType === 'e-flexbox' ) {
                try {
                    // Try to create the V4 element with the full structure
                    return $e.run( 'document/elements/create', {
                        model: {
                            id: v4Response.id,
                            elType: 'e-flexbox',
                            settings: v4Response.settings || {},
                            elements: v4Response.elements || [],
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
                    // If V4 creation fails, try simplified approach
                    const simplifiedSettings = {};

                    if ( v4Response.styles ) {
                        const styleKeys = Object.keys( v4Response.styles );
                        if ( styleKeys.length > 0 ) {
                            const firstStyle = v4Response.styles[styleKeys[0]];
                            if ( firstStyle.variants && firstStyle.variants[0] && firstStyle.variants[0].props ) {
                                const props = firstStyle.variants[0].props;
                                if ( props.background && props.background.value && props.background.value.color ) {
                                    simplifiedSettings.background_background = 'classic';
                                    simplifiedSettings.background_color = props.background.value.color.value;
                                }
                                if ( props['min-height'] && props['min-height'].value ) {
                                    simplifiedSettings.min_height = {
                                        unit: props['min-height'].value.unit,
                                        size: props['min-height'].value.size
                                    };
                                }
                                if ( props['max-width'] && props['max-width'].value ) {
                                    simplifiedSettings.boxed_width = {
                                        unit: props['max-width'].value.unit,
                                        size: props['max-width'].value.size
                                    };
                                }
                                if ( props['border-color'] && props['border-color'].value ) {
                                    simplifiedSettings.border_color = props['border-color'].value;
                                }
                                if ( props['border-width'] && props['border-width'].value ) {
                                    simplifiedSettings.border_width = {
                                        unit: props['border-width'].value.unit,
                                        top: props['border-width'].value.size,
                                        right: props['border-width'].value.size,
                                        bottom: props['border-width'].value.size,
                                        left: props['border-width'].value.size,
                                        isLinked: true
                                    };
                                }
                                if ( props['border-radius'] && props['border-radius'].value ) {
                                    simplifiedSettings.border_radius = {
                                        unit: props['border-radius'].value.unit,
                                        top: props['border-radius'].value.size,
                                        right: props['border-radius'].value.size,
                                        bottom: props['border-radius'].value.size,
                                        left: props['border-radius'].value.size,
                                        isLinked: true
                                    };
                                }
                                if ( props['border-style'] && props['border-style'].value ) {
                                    simplifiedSettings.border_border = props['border-style'].value;
                                }
                            }
                        }
                    }

                    // Try creating as V4 flexbox with simplified settings
                    return $e.run( 'document/elements/create', {
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
            } else {
                // Handle regular container format
                return $e.run( 'document/elements/create', {
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
                const v4Response = await AIConverterAPI.convertContainer( containerData );

                // Get parent container for positioning
                const rootContainer = view.container.parent || elementor.getPreviewContainer();

                ContainerService.createV4Element( v4Response, rootContainer, 1 );

                // Show success notification
                NotificationService.success( 'Container converted to V4 successfully!' );

            } catch ( error ) {
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


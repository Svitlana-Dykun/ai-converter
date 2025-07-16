

jQuery( window ).on( 'elementor:init', function() {

    const AIConverterAPI = {

        async convertContainer( containerData ) {
            const endpoint = aiConverter.webhookUrl;

            try {
                const response = await axios.post( endpoint, containerData, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    timeout: 30000
                });

                return response.data;
            } catch ( error ) {
                console.error( 'AI Conversion API Error:', error );
                throw new Error( `AI conversion failed: ${error.message}` );
            }
        }
    };


    const ContainerService = {
        extractContainerData( view ) {
            return {
                elType: view.model.get('elType'),
                settings: view.model.get('settings')?.toJSON({ remove: 'default' }) || {},
                elements: view.model.get('elements') || [],
            };
        },

        createV4Element( v4Response, parentContainer, index = 0 ) {
            return $e.run( 'document/elements/create', {
                model: { ...v4Response },
                container: parentContainer,
                options: {
                    at: index,
                    edit: false,
                },
            });
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
                const rootContainer = view.container.parent;

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
                        ConversionHandler.handleConversion( view );
                    }
                }
            ]
        };

        groups.push( converterGroup );
        return groups;
    });
} );


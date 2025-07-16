<?php

namespace AiConvertor;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

class AdminSettings {
	
	public function __construct() {
		add_action( 'admin_menu', [ $this, 'add_admin_menu' ] );
		add_action( 'admin_init', [ $this, 'settings_init' ] );
	}
	
	public function add_admin_menu() {
		add_options_page(
			'AI Converter Settings',
			'AI Converter',
			'manage_options',
			'ai-converter-settings',
			[ $this, 'settings_page' ]
		);
	}
	
	public function settings_init() {
		register_setting( 'ai_converter_settings', 'ai_converter_openai_key' );
		
		add_settings_section(
			'ai_converter_section',
			'OpenAI Configuration',
			[ $this, 'settings_section_callback' ],
			'ai_converter_settings'
		);
		
		add_settings_field(
			'ai_converter_openai_key',
			'OpenAI API Key',
			[ $this, 'api_key_field_callback' ],
			'ai_converter_settings',
			'ai_converter_section'
		);
	}
	
	public function settings_section_callback() {
		echo '<p>Configure your OpenAI API key to enable AI-powered widget conversion.</p>';
	}
	
	public function api_key_field_callback() {
		$api_key = get_option( 'ai_converter_openai_key', '' );
		echo '<input type="password" name="ai_converter_openai_key" value="' . esc_attr( $api_key ) . '" size="50" />';
		echo '<p class="description">Enter your OpenAI API key. This will be stored securely in your WordPress database.</p>';
	}
	
	public function settings_page() {
		?>
		<div class="wrap">
			<h1>AI Converter Settings</h1>
			<form method="post" action="options.php">
				<?php
				settings_fields( 'ai_converter_settings' );
				do_settings_sections( 'ai_converter_settings' );
				submit_button();
				?>
			</form>
			
			<div style="margin-top: 30px; padding: 20px; background: #f1f1f1; border-radius: 5px;">
				<h3>How to get your OpenAI API Key:</h3>
				<ol>
					<li>Go to <a href="https://platform.openai.com/api-keys" target="_blank">OpenAI API Keys</a></li>
					<li>Create a new API key</li>
					<li>Copy the key and paste it above</li>
					<li>Save the settings</li>
				</ol>
				<p><strong>Note:</strong> Your API key is stored securely in your WordPress database and is never exposed to the frontend.</p>
			</div>
		</div>
		<?php
	}
} 
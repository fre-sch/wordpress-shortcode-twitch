<?php
/*
Plugin Name: Shortcode Twitch
Description: Shortcode Twitch
Version: 1.1
Author: F.Schumacher
Author URI: http://www.google.com/
License: GPL v2

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License, version 2, as
    published by the Free Software Foundation.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program; if not, write to the Free Software
    Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA

*/

define('SHORTCODE_TWITCH_BASE', plugin_dir_path(__FILE__));
define('SHORTCODE_TWITCH_VER', '1.1');
define('SHORTCODE_TWITCH_URL', plugins_url('/' . basename(dirname(__FILE__))));


/**
 * Enqueue scripts and CSS
 * Called by enqueue_scripts action
 * @return void
 */
function shortcode_twitch_enqueue_scripts()
{
	wp_enqueue_style('shortcode_twitch',  SHORTCODE_TWITCH_URL .'/css/shortcode-twitch.css', array(), SHORTCODE_TWITCH_VER);
	wp_enqueue_script('shortcode_twitch', SHORTCODE_TWITCH_URL .'/js/shortcode-twitch.js',   array(), SHORTCODE_TWITCH_VER, true);
}
add_action('wp_enqueue_scripts', 'shortcode_twitch_enqueue_scripts');


function shortcode_twitch_callback($attrs, $content=null) {
	ob_start();
	?>
	<div class="shoco-twitch-channel"
			id="shoco-twitch-channel-<?php echo $attrs["channel"] ?>"
			data-channel="<?php echo $attrs["channel"] ?>"
			style="display:none">
		<h4><span class="shoco-twitch-display-name"></span></h4>
		
		<div class="shoco-twitch-channel-logo"><img src="<?php echo SHORTCODE_TWITCH_URL .'/css/logo-default.png' ?>"/></div>
		<div class="shoco-twitch-details">
			<div class="shoco-twitch-user-bio"><?php echo apply_filters("the_content", $content)?></div>

			<p class="shoco-twitch-channel-online"><i class="shoco-twitch-channel-online-icon"></i>Streaming: <span class="shoco-twitch-channel-game"></span><br/>
				<strong class="shoco-twitch-channel-topic"></strong>
			</p>
			<span class="shoco-twitch-channel-online">Viewers: <span class="shoco-twitch-channel-viewers"></span>,</span>
			Followers: <span class="shoco-twitch-channel-followers"></span>,
			<a class="shoco-twitch-channel-link" target="_blank" href="">Go to channel</a>
		</div>
	</div>
	<?php
	return ob_get_clean();
}
add_shortcode("twitch", "shortcode_twitch_callback");




/**
 * Declares Javascript variables and custom fonts
 * Called by wp_head action
 * @return void
 */
function shortcode_twitch_js_vars()
{
	?>
	<script type="text/javascript">
		var shocoTwitch = {
			'ajaxurl': "<?php echo admin_url('admin-ajax.php') ?>"
		};
	</script>
    <?php
}
add_action('wp_head','shortcode_twitch_js_vars');


class TwitchAPI {
	var $context = null;
	var $baseURL = "https://api.twitch.tv/kraken";

	function __construct() {
		$this->context = stream_context_create(array(
			"http" => array(
				"method" => "GET",
				"header" => "Accept: application/vnd.twitchtv.v3+json\r\n"
			)
		));
	}

	function cacheFile($context, $id) {
		return SHORTCODE_TWITCH_BASE . "cache/{$context}.{$id}.json";
	}

	function cacheExpired($cacheFile, $cacheTTL=0) {
		if (!$cacheTTL) $cacheTTL = 60 * 60 * 24; // a day
		$age = time() - @filemtime($cacheFile);
		return $age >= $cacheTTL;
	}

	function request($type, $userName, $cacheTTL=0) {
		$cacheFile = $this->cacheFile($type, $userName);
		if ($this->cacheExpired($cacheFile, $cacheTTL)) {
			$data = @file_get_contents("{$this->baseURL}/{$type}/{$userName}",
					false, $this->context);
			
			if (!empty($data))
				@file_put_contents($cacheFile, $data);

			return @json_decode($data, true);
		}
		return @json_decode(@file_get_contents($cacheFile), true);
	}
}


function shortcode_twitch_get_channel_data_ajax() {
	// Fetch stream and channel information from Twitch
	header('Content-type: application/json; charset=utf-8');

	$channels = $_POST["channels"];
	$api = new TwitchAPI();
	$jsonData = array();

	foreach ($channels as $channel) {
		$now = time();
		$requestData = $api->request("channels", $channel);
		if (empty($requestData) || !empty($requestData["error"])) {
			$jsonData[$channel] = "error";
		}
		else {
			$jsonData[$channel] = $requestData;
		}
	}
	echo json_encode($jsonData);
	unset($api);
	die();
}


function shortcode_twitch_get_user_data_ajax() {
	// Fetch stream and channel information from Twitch
	header('Content-type: application/json; charset=utf-8');

	$channels = $_POST["channels"];
	$api = new TwitchAPI();
	$jsonData = array();

	foreach ($channels as $channel) {
		$now = time();
		$requestData = $api->request("users", $channel);
		if (empty($requestData) || !empty($requestData["error"])) {
			$jsonData[$channel] = "error";
		}
		else {
			$jsonData[$channel] = $requestData;
		}
	}
	echo json_encode($jsonData);
	unset($api);
	die();
}


function shortcode_twitch_get_stream_data_ajax() {
	// Fetch stream and channel information from Twitch
	header('Content-type: application/json; charset=utf-8');

	$channels = $_POST["channels"];
	$api = new TwitchAPI();
	$jsonData = array();

	foreach ($channels as $channel) {
		$now = time();
		$requestData = $api->request("streams", $channel, 30);
		if (empty($requestData) || !empty($requestData["error"])) {
			$jsonData[$channel] = "error";
		}
		else {
			$jsonData[$channel] = $requestData["stream"];
		}
	}
	echo json_encode($jsonData);
	unset($api);
	die();
}

add_action( 'wp_ajax_get_twitch_channel_data', 'shortcode_twitch_get_channel_data_ajax' );
add_action( 'wp_ajax_nopriv_get_twitch_channel_data', 'shortcode_twitch_get_channel_data_ajax' );

add_action( 'wp_ajax_get_twitch_user_data', 'shortcode_twitch_get_user_data_ajax' );
add_action( 'wp_ajax_nopriv_get_twitch_user_data', 'shortcode_twitch_get_user_data_ajax' );

add_action( 'wp_ajax_get_twitch_stream_data', 'shortcode_twitch_get_stream_data_ajax' );
add_action( 'wp_ajax_nopriv_get_twitch_stream_data', 'shortcode_twitch_get_stream_data_ajax' );

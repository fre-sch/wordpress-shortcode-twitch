<?php
define('SHORTCODE_TWITCH_BASE', '/var/www/wordpress/wp-content/plugins/shortcode-twitch');

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
		return SHORTCODE_TWITCH_BASE . "/cache/{$context}.{$id}.json";
	}

	function cacheExpired($cacheFile, $cacheTTL=0) {
		if (!$cacheTTL) $cacheTTL = 60 * 60 * 24; // a day
		$now = time();
		$filemtime = @filemtime($cacheFile);
		$age = $now - $filemtime;
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
}


function shortcode_twitch_get_user_data_ajax() {
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
}


function shortcode_twitch_get_stream_data_ajax() {
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
}

switch($_POST["action"]) {
	case "get_twitch_channel_data":
		shortcode_twitch_get_channel_data_ajax();
		die;
	case "get_twitch_user_data":
		shortcode_twitch_get_user_data_ajax();
		die;
	case "get_twitch_stream_data":
		shortcode_twitch_get_stream_data_ajax();
		die;
}


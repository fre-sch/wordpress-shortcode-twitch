var shocoTwitchData = {};
var USER_TTL = 1000 * 60 * 10
var CHANNEL_TTL =  1000 * 60 * 10;
var STREAM_TTL = 1000 * 30;

if (!Storage.prototype.setObject) {
	Storage.prototype.setObject = function(key, value) {
		this.setItem(key, JSON.stringify(value));
	};
}
if (!Storage.prototype.getObject) {
	Storage.prototype.getObject = function(key) {
		var value = this.getItem(key);
		return value && JSON.parse(value);
	}
}

jQuery(document).ready(function() {

	jQuery(".shoco-twitch-channel").each(function () {
		var channelName = jQuery(this).data("channel");
		shocoTwitchData[channelName] = {
			"status": "offline",
			"channel": "error",
			"user": "error",
			"stream": "error"
		};
	})

	shocoUpdateUsers();
	setInterval(shocoUpdateUsers, USER_TTL);

	shocoUpdateChannels();
	setInterval(shocoUpdateChannels, CHANNEL_TTL);

	shocoUpdateStreams();
	setInterval(shocoUpdateStreams, STREAM_TTL);
});


function shocoUpdateUsers() {
	jQuery.each(shocoTwitchData, function(channelName, channelData) {
		channelData.user = localStorage.getObject(channelName + ".user");
		var age = channelData.user && channelData.user.timestamp ? Date.now() - channelData.user.timestamp : USER_TTL + 1;
		if (!channelData.user || age > USER_TTL) {
			console.info("refreshing localstorage user data");
			jQuery.ajax({
				url: "https://api.twitch.tv/kraken/users/"+channelName,
				accepts: "application/vnd.twitchtv.v3+json",
				dataType: 'jsonp',
				success: function(response, status) {
					if (status !== 'success')
						return;
					channelData.user = response;
					channelData.user.timestamp = Date.now();
					localStorage.setObject(channelName + ".user", channelData.user);
				}
			}).always(function () {
				shocoTwitchRefreshWidget(channelName, channelData);
			});
		}
	});
}


function shocoUpdateChannels() {
	jQuery.each(shocoTwitchData, function(channelName, channelData) {
		channelData.channel = localStorage.getObject(channelName + ".channel");
		var age = channelData.channel && channelData.channel.timestamp ? Date.now() - channelData.channel.timestamp : USER_TTL + 1;
		if (!channelData.channel || age > CHANNEL_TTL) {
			console.info("refreshing localstorage channel data");
			jQuery.ajax({
				url: "https://api.twitch.tv/kraken/channels/"+channelName,
				accepts: "application/vnd.twitchtv.v3+json",
				dataType: 'jsonp',
				success: function(response, status) {
					if (status !== 'success')
						return;
					channelData.channel = response;
					channelData.channel.timestamp = Date.now();
					localStorage.setObject(channelName + ".channel", channelData.channel);
				}
			}).always(function () {
				shocoTwitchRefreshWidget(channelName, channelData);
			});
		}
	});
}


function shocoUpdateStreams() {
	jQuery.each(shocoTwitchData, function(channelName, channelData) {
		jQuery.ajax({
			url: "https://api.twitch.tv/kraken/streams/"+channelName,
			accepts: "application/vnd.twitchtv.v3+json",
			dataType: 'jsonp',
			success: function(response, status) {
				if (status !== 'success')
					return;
				channelData.stream = response.stream;
				channelData.status = response.stream ? 'online' : 'offline';
				if (response.stream && response.stream.channel)  {
					channelData.channel.game = response.stream.channel.game;
					channelData.channel.game = response.stream.channel.game;
					channelData.channel.timestamp = Date.now();
					localStorage.setObject(channelName + ".channel", channelData.channel);
				}
			}
		}).always(function () {
			shocoTwitchRefreshWidget(channelName, channelData);
		});
	});
}


function shocoTwitchRefreshWidget(channel, data) {

	var sel = '#shoco-twitch-channel-' + channel;

	jQuery(sel).show();

	if (data.channel !== 'error') {
		jQuery(sel + ' .shoco-twitch-display-name').html(data.channel.display_name);
		jQuery(sel + ' .shoco-twitch-channel-followers').html(data.channel.followers);
		jQuery(sel + ' .shoco-twitch-channel-link').attr("href", data.channel.url);
		jQuery(sel + ' .shoco-twitch-channel-topic').html(data.channel.status);
		jQuery(sel + ' .shoco-twitch-channel-game').html(data.channel.game);
		if (data.channel.logo)
			jQuery(sel + ' .shoco-twitch-channel-logo img').attr("src", data.channel.logo);
	}

	if (data.user !== 'error') {
		if (data.user.bio)
			jQuery(sel + ' .shoco-twitch-user-bio').html(data.user.bio);
	}

	if (data.stream !== 'error' && data.status === 'online') {
		jQuery(sel + ' .shoco-twitch-channel-online').show();
		jQuery(sel + ' .shoco-twitch-channel-viewers').html(data.stream.viewers);
	}
	else
	{
		jQuery(sel + ' .shoco-twitch-channel-online').hide();
	}
}
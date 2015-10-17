var shocoTwitchData = {};

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

	shocoTwitchUpdate(); // Update Twitch status buttons
	setInterval(shocoTwitchUpdate, 1000 * 60 * 60);

	shocoTwitchStreamRefresh();
	setInterval(shocoTwitchStreamRefresh, 1000 * 30);
});



function shocoTwitchUpdate()
{	
	var channels = [];
	jQuery(".shoco-twitch-channel").each(function () {
		var channel = jQuery(this).data("channel");
		channels.push(channel);

		jQuery.get(shocoTwitch.cacheurl + "/users." + channel + ".json", function(response) {
			shocoTwitchData[channel].user = response || "error";
			shocoTwitchRefreshWidget(channel)
		});

		if (shocoTwitchData[channel].user === "error") {
			jQuery.post(shocoTwitch.ajaxurl, {
				'action': 'get_twitch_user_data',
				'channels': [channel]
			}, function(response, status) {
				if (status !== 'success')
					return;
				jQuery.each(response, function(channelName, data) {
					shocoTwitchData[channelName].user = data;
					shocoTwitchRefreshWidget(channelName)
				});
			});
		}

		jQuery.get(shocoTwitch.cacheurl + "/channels." + channel + ".json", function(response) {
			shocoTwitchData[channel].channel = response || "error";
		});

		if (shocoTwitchData[channel].channel === "error") {
			jQuery.post(shocoTwitch.ajaxurl, {
				'action': 'get_twitch_channel_data',
				'channels': [channel]
			}, function(response, status) {
				if (status !== 'success')
					return;
				jQuery.each(response, function(channelName, data) {
					shocoTwitchData[channelName].channel = data;
					shocoTwitchRefreshWidget(channelName)
				});
			});
		}
	});
}

function shocoTwitchStreamRefresh() {
	var channels = [];
	jQuery(".shoco-twitch-channel").each(function () {
		channels.push(jQuery(this).data("channel"));
	});
	jQuery.each(channels, function(i, channel) {
		jQuery.ajax({
			url: "https://api.twitch.tv/kraken/streams/"+channel,
			accepts: "application/vnd.twitchtv.v3+json",
			dataType: 'jsonp',
			success: function(response, status) {
				if (status !== 'success')
					return;
				shocoTwitchData[channel].stream = response.stream;
				shocoTwitchData[channel].status = (response.stream
						? 'online' : 'offline'); 
				shocoTwitchRefreshWidget(channel);
			}
		});
	});
}


function shocoTwitchRefreshWidget(channel) {


	var sel = '#shoco-twitch-channel-' + channel;
	var data = shocoTwitchData[channel];

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
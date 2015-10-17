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
	setInterval(shocoTwitchUpdate, 30000); // Update every 30 seconds
});



function shocoTwitchUpdate()
{	
	var channels = [];
	jQuery(".shoco-twitch-channel").each(function () {
		channels.push(jQuery(this).data("channel"));
	});

	jQuery.post(shocoTwitch.ajaxurl, {
		'action': 'get_twitch_channel_data',
		'channels': channels
	}, function(response, status) {
		if (status !== 'success')
			return;
		jQuery.each(response, function(channelName, data) {
			shocoTwitchData[channelName].channel = data;
			shocoTwitchRefreshWidget(channelName)
		});
	});

	jQuery.post(shocoTwitch.ajaxurl, {
		'action': 'get_twitch_user_data',
		'channels': channels
	}, function(response, status) {
		if (status !== 'success')
			return;
		jQuery.each(response, function(channelName, data) {
			shocoTwitchData[channelName].user = data;
			shocoTwitchRefreshWidget(channelName)
		});
	});

	jQuery.post(shocoTwitch.ajaxurl, {
		'action': 'get_twitch_stream_data',
		'channels': channels
	}, function(response, status) {
		if (status !== 'success')
			return;
		jQuery.each(response, function(channelName, data) {
			shocoTwitchData[channelName].stream = data;
			shocoTwitchData[channelName].status = (data && data !== 'error'
					? 'online' : 'offline'); 
			shocoTwitchRefreshWidget(channelName);
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
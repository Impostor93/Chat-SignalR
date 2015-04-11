
$.RequestCreator = function (Options)
{
    var defaults =
        {
            Services: "/ChatServices/ChatService.asmx/",
            Methods: "",
            Type: "POST",
            ContentType: "application/json;",
            Params: "{}",
            customParameterFormat: false,
            async: true,
            CreateRequest: function(data){ },
            Error: function (error) { },
            }
            var settings = $.extend({}, defaults, Options);
            var Parameters = JSON.stringify(settings.Params);
            var Url = settings.Services + settings.Methods;
            if (!settings.customParameterFormat) {
                if (settings.Params != "{}") {
                    Parameters = "{";

                    for (var i in settings.Params)
                        Parameters += "\"" + i + "\":\"" + settings.Params[i] + "\","

                    Parameters = Parameters.substring(0, Parameters.length - 1) + "}";
                } else
                    Parameters = settings.Params;
            } else
                Parameters = settings.Params;

            $.ajax({
                contentType: settings.ContentType,
                data: Parameters,
                type: settings.Type,
                url: Url,
                success: function (date) {
                    settings.CreateRequest(date);
                },
                error: function (error) {
                    settings.Error(error, "RequestCreator");
                }
            });
}
﻿using System;
using Microsoft.AspNet.SignalR;

namespace Chat.SignalR
{
    public class CustomIdUserProvider : IUserIdProvider
    {
        public Guid UserId { get; set; }

        public CustomIdUserProvider()
        {
        }

        public CustomIdUserProvider(Guid userId)
        {
            UserId = userId;
        }

        public string GetUserId(IRequest request)
        {
            return UserId.ToString();
        }
    }
}
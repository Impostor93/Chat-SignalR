//------------------------------------------------------------------------------
// <auto-generated>
//     This code was generated from a template.
//
//     Manual changes to this file may cause unexpected behavior in your application.
//     Manual changes to this file will be overwritten if the code is regenerated.
// </auto-generated>
//------------------------------------------------------------------------------

namespace Chat.DAL
{
    using System;
    using System.Collections.Generic;
    
    public partial class tblChatRoom
    {
        public tblChatRoom()
        {
            this.tblRoomMessageSessions = new HashSet<tblRoomMessageSession>();
            this.tblRoomUsers = new HashSet<tblRoomUser>();
        }
    
        public int IdRoom { get; set; }
        public System.Guid RoomIdentifier { get; set; }
        public Nullable<int> HashIdentifier { get; set; }
        public string UserInRoom { get; set; }
        public string UserCreater { get; set; }
        public Nullable<System.DateTime> DateCreated { get; set; }
        public Nullable<System.DateTime> DateChanged { get; set; }
    
        public virtual ICollection<tblRoomMessageSession> tblRoomMessageSessions { get; set; }
        public virtual ICollection<tblRoomUser> tblRoomUsers { get; set; }
    }
}

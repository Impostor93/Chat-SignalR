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
    
    public partial class tblUserLogin
    {
        public tblUserLogin()
        {
            this.tblChatUsers = new HashSet<tblChatUser>();
        }
    
        public int IdLogin { get; set; }
        public string UserName { get; set; }
        public Nullable<System.DateTime> DateCreated { get; set; }
        public Nullable<System.DateTime> DateChanged { get; set; }
        public string AspAuthenticationUserId { get; set; }
    
        public virtual AspNetUser AspNetUser { get; set; }
        public virtual ICollection<tblChatUser> tblChatUsers { get; set; }
    }
}

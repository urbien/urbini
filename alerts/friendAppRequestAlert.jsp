<div>
    <property name="(http://www.hudsonfog.com/voc/model/social/FriendApp)forum.friend1" href="y"/> <text text="friended your app" /> <property name="(http://www.hudsonfog.com/voc/model/social/FriendApp)forum.friend2" href="y"/>
    <br /><br />
    <where value="forum.message != null">
    <property name="(http://www.hudsonfog.com/voc/model/social/FriendApp)forum.friend1.creator" href="y"/> says: "<property name='(http://www.hudsonfog.com/voc/model/social/FriendApp)forum.message' />"
      <br /><br />
    </where>
    
    <where value="forum.friend1.featured1 != null">
      <property name="(http://www.hudsonfog.com/voc/model/company/Friend)forum.friend1.featured1" href="y" />
      <br /><br />
    </where>
    <a href="mkResource.html?friend1=-$this.forum.friend2&amp;-friend2=-$this.forum.friend1&amp;$action=showPropertiesForEdit"><text text="Reciprocate Friendship" /></a> 
</div>
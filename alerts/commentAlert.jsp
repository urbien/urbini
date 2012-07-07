<div>
  <!--text text="Comment"/ -->
    <where value="alias == null">
      <property name="sender" noIcon="y"/>
    </where>
    <where value="alias != null">
      <property name="alias" noIcon="y"/>
    </where> 

    <where value="sender.gender != 'Female'">
      &#160;<text text="added comment"/>
    </where>
    <where value="sender.gender == 'Female'">
      &#160;<text text="added! comment"/>
    </where>
  

    <property name="comment" noIcon="y"/> <br/>
		<text text="to the resource"/>: 
		<where value="forum.getUri() != getContact()">
		  <property name="forum" href="y" noIcon="y"/>
		</where>
    <where value="forum.getUri() == getContact()">
      <property name="forum" href="y" noIcon="y" adTitle="your profile"/>
    </where>
    
		<br/>
		<br/>
		<text text="To reply to this comment follow the link above"/>.
		<br/>
		<where value="getWebSite().sharedHost == true">
    <br/>
    <br/>
      <localLink href="/alias/mojo">
		    <text text="Each comment gives you mojo points"/>
		  </localLink>
		</where>
		<where value="resourceDescription != null  &&  !getWebSite().sharedHost">
		  <property name="resourceDescription"/>
		</where>
</div>
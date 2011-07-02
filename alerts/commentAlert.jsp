<div>
<text text="Comment"/> <property name="comment" noIcon="y"/> <br/>
		<text text="has been added to the"/>: <property name="forum" href="y" noIcon="y"/>
		<br/>
		<br/>
		<text text="To reply to this comment follow the link above"/>.
		<br/>
		<where value="getWebSite().sharedHost == true">
    <br/>
    <br/>
      <localLink href="/l.html?-q=how+to+earn+karma+points">
		    <text text="Each comment gives you karma points"/>
		  </localLink>
		</where>
		<where value="resourceDescription != null  &&  !getWebSite().sharedHost">
		  <property name="resourceDescription"/>
		</where>
</div>
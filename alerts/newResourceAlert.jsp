<div>
    <where value="delegatedTo == null">
		  <text text="created new resource"/> 
		</where>
    <where value="delegatedTo != null">
      <text text="added new resource"/> 
    </where>
		
		<property name="forum" type="y" noIcon="y"/> <property name="forum" href="y" noIcon="y"/>.
		<br />
		<where value="resourceImage != null">
		<br/>
		  <property name="resourceImage" noIcon="y"/><br/>
		</where>
		<where value="delegatedTo != null"> 
		  <text text="to"/> <property name="delegatedTo" type="y" noIcon="y"/> <property name="delegatedTo" href="y" noIcon="y"/>.
    </where>
</div>
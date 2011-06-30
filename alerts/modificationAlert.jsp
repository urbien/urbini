<div>
		<text text="Modified resource"/> <property name="forum" type="y"/>  <property name="forum" href="y" noIcon="y"/> 
		<br/><br/>
		<where value="modification != null">
		  <text text="Changes below are made by" />: <property name="sender.firstName" href="y" /> <property name="sender.lastName" href="y" />
      <br/>
	  	<property name="modification.newValues" noIcon="y"/>
      <br/>
    </where>
    <where value="modification == null">
      <br/>
  		  <property name="description" noIcon="y"/>
      <br/>
		</where>
</div>
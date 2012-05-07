<div>
    <where value="body == null">
      <text text="#### thought you might be interested in this:" params="sender.getDisplayName()" />
    </where>
    <where value="body != null">
      <text text="#### says:" params="sender.getDisplayName()" />
      <br /><br />
      <blockquote><i><text text="####" params="body" /></i></blockquote>
    </where>
    <property name="forum" href="y" noIcon="y" />
    <br /><br />
    <property name="resourceMediumImage" href="y" noIcon="y"/>
</div>
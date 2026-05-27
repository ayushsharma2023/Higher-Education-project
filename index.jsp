<%@ Page import ="java.net.*" %>
<html>
    <body>
        <h2>Your IPAddress is:</h2>
        <%String ipAddress=req.getRemoteAddr();%>
        out.println(ipAddress);
    </body>
</html>
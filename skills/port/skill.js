const PORTS = {
  20:'FTP data',21:'FTP control',22:'SSH',23:'Telnet',25:'SMTP',
  53:'DNS',67:'DHCP server',68:'DHCP client',69:'TFTP',
  80:'HTTP',110:'POP3',119:'NNTP',123:'NTP',143:'IMAP',
  161:'SNMP',162:'SNMP trap',194:'IRC',389:'LDAP',
  443:'HTTPS',445:'SMB (Windows file sharing)',465:'SMTPS',
  500:'IKE / IPsec',514:'Syslog',515:'LPD printing',
  587:'SMTP submission',631:'IPP printing',636:'LDAPS',
  873:'rsync',993:'IMAPS',995:'POP3S',
  1080:'SOCKS proxy',1194:'OpenVPN',1433:'MSSQL Server',
  1521:'Oracle DB',1723:'PPTP VPN',
  2049:'NFS',2181:'ZooKeeper',2375:'Docker (unencrypted)',2376:'Docker (TLS)',
  2377:'Docker Swarm',3000:'Dev server (common default)',3306:'MySQL / MariaDB',
  3389:'RDP',4369:'Erlang Port Mapper (EPMD)',
  4443:'HTTPS alternative',4444:'Metasploit default',
  5000:'Flask / UPnP',5432:'PostgreSQL',5601:'Kibana',5672:'AMQP (RabbitMQ)',
  5900:'VNC',5984:'CouchDB',6379:'Redis',6443:'Kubernetes API',
  7001:'WebLogic',8080:'HTTP alternate / dev',8443:'HTTPS alternate',
  8888:'Jupyter Notebook',9000:'SonarQube / PHP-FPM',9042:'Cassandra',
  9092:'Apache Kafka',9200:'Elasticsearch HTTP',9300:'Elasticsearch cluster',
  11211:'Memcached',15672:'RabbitMQ management',27017:'MongoDB',27018:'MongoDB shard',
  28015:'RethinkDB',50070:'Hadoop NameNode',
};

export default {
  tag: 'port',
  instruction: `TCP PORT SKILL: To look up a well-known TCP/UDP port number, emit <port>number</port>.

Examples:
- "What uses port 443?" → <port>443</port>
- "Port 6379?" → <port>6379</port>`,
  call(content) {
    const n = parseInt(content.trim());
    if (isNaN(n) || n < 0 || n > 65535) return 'Enter a port number (0–65535).';
    const service = PORTS[n];
    const range = n < 1024 ? 'System / well-known (0–1023)' : n < 49152 ? 'Registered (1024–49151)' : 'Dynamic / ephemeral (49152–65535)';
    if (!service) return `Port ${n}: No well-known service registered\nRange: ${range}`;
    return `Port ${n}: ${service}\nRange: ${range}`;
  },
  async handle() {},
};

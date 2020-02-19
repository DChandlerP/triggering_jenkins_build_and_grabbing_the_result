The Jenkins API isn't well documented and requires a bit of experimentation to work with.
In this case, I had to trigger a build, grab the queue number from the location field in the header, wait until that Queue API had the build number,
grab the build number, and then wait for the build to finish to find out if the build was a success or failure.

Rather than making someone else suffer through trying to figure this out, I thought I'd throw this up and let someone learn
from the work I've done to build something that meets their needs. 
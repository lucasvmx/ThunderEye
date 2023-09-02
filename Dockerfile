FROM ubuntu:22.04

# Updates dependencies
RUN apt-get -y update && apt-get -y upgrade

# Install dependencies
RUN apt-get -y install curl
RUN curl -sL https://deb.nodesource.com/setup_18.x -o nodesource_setup.sh
RUN bash nodesource_setup.sh
RUN apt-get -y install nodejs
RUN node -v

# Install yarn
RUN curl -sL https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN apt-get -y update && apt-get -y install yarn
RUN yarn -v

# Deploy app
RUN mkdir /app

COPY . /app

WORKDIR /app

# Install app dependencies
RUN yarn

# Execute app
ENTRYPOINT [ "yarn", "test" ]
